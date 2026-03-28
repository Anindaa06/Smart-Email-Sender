from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import joblib
import os
from datetime import datetime

app = FastAPI(
    title='Smart Bulk Mailer - ML Service',
    description='Machine learning predictions for email campaigns',
    version='1.0.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5000', 'http://localhost:5173'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

MODEL_DIR = os.getenv('MODEL_DIR', './models')

try:
    spam_model = joblib.load(f'{MODEL_DIR}/spam_model.pkl')
    sendtime_model = joblib.load(f'{MODEL_DIR}/sendtime_model.pkl')
    performance_model = joblib.load(f'{MODEL_DIR}/performance_model.pkl')
except FileNotFoundError:
    spam_model = sendtime_model = performance_model = None

class SpamRequest(BaseModel):
    subject: str
    body: str

class SpamResponse(BaseModel):
    spam_probability: float
    is_spam: bool
    confidence: str

class SendTimeRequest(BaseModel):
    previous_send_times: Optional[list] = []
    open_rates: Optional[list] = []

class SendTimeResponse(BaseModel):
    recommended_hour: int
    recommended_day: int
    recommended_day_name: str
    expected_open_rate: float
    reasoning: str

class PerformanceRequest(BaseModel):
    subject: str
    recipient_count: int
    send_time: Optional[str] = None

class PerformanceResponse(BaseModel):
    expected_open_rate: float
    expected_click_rate: float
    performance_tier: str
    suggestions: list

@app.get('/health')
def health_check():
    return {
        'status': 'healthy',
        'models_loaded': spam_model is not None,
        'timestamp': datetime.now().isoformat(),
    }

@app.post('/predict-spam', response_model=SpamResponse)
def predict_spam(request: SpamRequest):
    if spam_model is None:
        raise HTTPException(status_code=503, detail='Spam model not loaded. Run train_models.py')

    text = f'{request.subject} {request.body}'
    probability = float(spam_model.predict_proba([text])[0][1])
    is_spam = probability > 0.5

    if probability < 0.3:
        confidence = 'high'
    elif probability < 0.6:
        confidence = 'medium'
    else:
        confidence = 'high'

    return SpamResponse(spam_probability=round(probability, 4), is_spam=is_spam, confidence=confidence)

@app.post('/predict-send-time', response_model=SendTimeResponse)
def predict_send_time(request: SendTimeRequest):
    if sendtime_model is None:
        raise HTTPException(status_code=503, detail='Send time model not loaded. Run train_models.py')

    best_score = -1
    best_hour = 9
    best_day = 1
    day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    for day in range(7):
        for hour in range(24):
            score = float(sendtime_model.predict([[hour, day]])[0])
            if score > best_score:
                best_score = score
                best_hour = hour
                best_day = day

    return SendTimeResponse(
        recommended_hour=best_hour,
        recommended_day=best_day,
        recommended_day_name=day_names[best_day],
        expected_open_rate=round(best_score, 4),
        reasoning=f'Based on historical patterns, {day_names[best_day]} at {best_hour}:00 yields the highest open rate.',
    )

@app.post('/predict-performance', response_model=PerformanceResponse)
def predict_performance(request: PerformanceRequest):
    if performance_model is None:
        raise HTTPException(status_code=503, detail='Performance model not loaded. Run train_models.py')

    hour = 9
    if request.send_time:
        try:
            dt = datetime.fromisoformat(request.send_time.replace('Z', '+00:00'))
            hour = dt.hour
        except Exception:
            pass

    subject_length = len(request.subject)
    features = [[subject_length, request.recipient_count, hour]]
    open_rate = float(performance_model.predict(features)[0])
    open_rate = max(0.0, min(1.0, open_rate))
    click_rate = open_rate * 0.2

    if open_rate >= 0.4:
        tier = 'excellent'
    elif open_rate >= 0.25:
        tier = 'good'
    elif open_rate >= 0.15:
        tier = 'average'
    else:
        tier = 'poor'

    suggestions = []
    if subject_length > 60:
        suggestions.append('Shorten your subject line to under 60 characters for better open rates.')
    if request.recipient_count > 200:
        suggestions.append('Consider segmenting your list into smaller targeted groups.')
    if hour < 8 or hour > 18:
        suggestions.append('Try sending during business hours (9am-6pm) for better engagement.')
    if not suggestions:
        suggestions.append('Your campaign looks well-optimized. Good luck!')

    return PerformanceResponse(
        expected_open_rate=round(open_rate, 4),
        expected_click_rate=round(click_rate, 4),
        performance_tier=tier,
        suggestions=suggestions,
    )
