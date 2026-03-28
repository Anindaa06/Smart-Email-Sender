import os
import joblib
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from data.training_data import get_spam_training_data, get_sendtime_training_data, get_performance_training_data

os.makedirs('./models', exist_ok=True)

print('Training spam detection model...')
spam_df = get_spam_training_data()
spam_df['text'] = spam_df['subject'] + ' ' + spam_df['body']
X_spam = spam_df['text']
y_spam = spam_df['is_spam']

spam_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2), stop_words='english')),
    ('clf', LogisticRegression(max_iter=1000, random_state=42)),
])
spam_pipeline.fit(X_spam, y_spam)
joblib.dump(spam_pipeline, './models/spam_model.pkl')
print('Spam model saved')

print('Training send time model...')
time_df = get_sendtime_training_data()
X_time = time_df[['hour', 'day_of_week']]
y_time = time_df['open_rate']
time_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
time_model.fit(X_time, y_time)
joblib.dump(time_model, './models/sendtime_model.pkl')
print('Send time model saved')

print('Training performance model...')
perf_df = get_performance_training_data()
X_perf = perf_df[['subject_length', 'recipient_count', 'hour']]
y_perf = perf_df['expected_open_rate']
perf_model = RandomForestRegressor(n_estimators=100, random_state=42)
perf_model.fit(X_perf, y_perf)
joblib.dump(perf_model, './models/performance_model.pkl')
print('Performance model saved')

print('All models trained and saved to ./models/')
