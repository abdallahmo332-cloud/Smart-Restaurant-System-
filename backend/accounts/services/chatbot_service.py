from openai import OpenAI
from django.conf import settings


class ChatbotService:
    @staticmethod
    def ask(user=None, message="", context_text=""):
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)

            user_name = getattr(user, "full_name", "") if user else ""
            user_role = getattr(user, "role", "customer") if user else "customer"

            system_prompt = f"""
You are the smart assistant for Smart Restaurant System.

Your job:
- Help users book restaurant reservations
- Help with food orders
- Recommend meals
- Explain payment methods
- Answer charity questions
- Speak Arabic if the user speaks Arabic
- Be friendly and concise

User name: {user_name}
User role: {user_role}

Extra context:
{context_text}
"""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": message
                    },
                ],
                temperature=0.7,
                max_tokens=300,
            )

            answer = response.choices[0].message.content
            return answer.strip()

        except Exception:
            return (
                "عذرًا، المساعد الذكي غير متاح حاليًا. "
                "يرجى المحاولة لاحقًا."
            )
            