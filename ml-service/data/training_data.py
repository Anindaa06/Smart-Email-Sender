import pandas as pd
import numpy as np

def get_spam_training_data():
    data = [
        {"subject": "Project update for Q4", "body": "Please find the attached report for this quarter.", "is_spam": 0},
        {"subject": "Meeting scheduled for Monday", "body": "Hi team, we have a standup at 10am.", "is_spam": 0},
        {"subject": "Invoice #1042 from Acme Corp", "body": "Please process the attached invoice at your convenience.", "is_spam": 0},
        {"subject": "Welcome to our platform", "body": "Thank you for signing up. Here is how to get started.", "is_spam": 0},
        {"subject": "Your order has shipped", "body": "Your order #5532 has been dispatched and will arrive by Friday.", "is_spam": 0},
        {"subject": "Team lunch on Friday", "body": "We are celebrating our product launch this Friday at noon.", "is_spam": 0},
        {"subject": "Feedback request", "body": "We would love to hear your thoughts on our recent webinar.", "is_spam": 0},
        {"subject": "Quarterly review reminder", "body": "This is a reminder that your quarterly review is next week.", "is_spam": 0},
        {"subject": "YOU WON $1,000,000!!!", "body": "Click here NOW to claim your FREE prize money immediately!!!", "is_spam": 1},
        {"subject": "FREE OFFER LIMITED TIME", "body": "Buy now get 90% OFF!!! Act fast before it expires TONIGHT.", "is_spam": 1},
        {"subject": "Make $5000 from home daily", "body": "Work from home earn unlimited cash no experience needed click now.", "is_spam": 1},
        {"subject": "Urgent: Your account suspended", "body": "Verify your bank details immediately to avoid permanent suspension.", "is_spam": 1},
        {"subject": "Hot singles in your area", "body": "Meet hot singles near you tonight. Click here for free access.", "is_spam": 1},
        {"subject": "Cheap meds no prescription", "body": "Order prescription drugs online without a doctor. 80% off today.", "is_spam": 1},
        {"subject": "CONGRATULATIONS you are selected", "body": "You have been randomly selected for a cash reward. Claim now.", "is_spam": 1},
        {"subject": "Weight loss miracle pill", "body": "Lose 30 pounds in 30 days guaranteed. No exercise needed. Buy now.", "is_spam": 1},
    ]
    return pd.DataFrame(data * 10)

def get_sendtime_training_data():
    np.random.seed(42)
    records = []
    for _ in range(500):
        hour = np.random.randint(0, 24)
        day = np.random.randint(0, 7)
        base = 0.15
        if day < 5:
            base += 0.10
        if 9 <= hour <= 11 or 14 <= hour <= 16:
            base += 0.20
        open_rate = min(base + np.random.normal(0, 0.05), 1.0)
        records.append({"hour": hour, "day_of_week": day, "open_rate": max(open_rate, 0)})
    return pd.DataFrame(records)

def get_performance_training_data():
    np.random.seed(42)
    records = []
    for _ in range(500):
        subject_length = np.random.randint(5, 100)
        recipient_count = np.random.randint(1, 500)
        hour = np.random.randint(0, 24)
        rate = 0.3
        if subject_length < 50:
            rate += 0.1
        if recipient_count < 50:
            rate += 0.1
        if 9 <= hour <= 11:
            rate += 0.15
        open_rate = min(rate + np.random.normal(0, 0.05), 1.0)
        records.append({
            "subject_length": subject_length,
            "recipient_count": recipient_count,
            "hour": hour,
            "expected_open_rate": max(open_rate, 0),
        })
    return pd.DataFrame(records)
