# -*- coding: utf-8 -*-
import json
import re
from pathlib import Path

# Groups in DOM order (meet, tickets, vk). Astana/Almaty are combined ticketon links.
raw = [
  ("vvk", False, "https://xxl.tours/#ticketscloud:event=6a8849fdd536a16b2033951a&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a862715b22a215e4a4555e4&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.com/5opka_mellsher_vvk"),
  ("hbr", False, "https://xxl.tours/#ticketscloud:event=6a8ae3b074d47b3e716d1a15&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a8633b00a5a823488f8e3e0&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.com/5opka_mellsher_hbr"),
  ("tse", True, "http://ticketon.kz/event/tckt2-posledniy-tur-5opka-astana", "http://ticketon.kz/event/tckt2-posledniy-tur-5opka-astana", "https://vk.ru/5opka_mellsher_tse"),
  ("ala", True, "http://ticketon.kz/event/tckt2-posledniy-tur-5opka-almaty", "http://ticketon.kz/event/tckt2-posledniy-tur-5opka-almaty", "https://vk.ru/5opka_mellsher_ala"),
  ("irk", False, "https://xxl.tours/#ticketscloud:event=6a8af76cfdfbd5ba43c22d4f&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a88e55cc6c9ca69b3e060e4&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.com/5opka_mellsher_irk"),
  ("krk", False, "https://xxl.tours/#ticketscloud:event=6a8b0ae920a8ab740dfb2ee4&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a8638bf91a2ddb8ee6cdefc&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.com/5opka_mellsher_krk"),
  ("42", False, "https://xxl.tours/#ticketscloud:event=6a8b4192924d4b1b7b7d84e3&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a863f9e4ec7baa19a95e9ad&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.ru/5opka_mellsher_42"),
  ("nsk", False, "https://xxl.tours/#ticketscloud:event=6a8b42a0940fc297c8fe873c&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a88e84773ac715a210b3793&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.ru/5opka_mellsher_nsk"),
  ("msk", False, "https://xxl.tours/#ticketscloud:event=6a8b44a97b82fdaf9ba02836&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a861eb75449a207c907832c&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.com/5opka_mellsher_msk"),
  ("yar", False, "https://xxl.tours/#ticketscloud:event=6a8b51218499b6ae95d97510&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a88ed1987f4fc3211c63e71&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.ru/5opka_mellsher_yar"),
  ("nn", False, "https://xxl.tours/#ticketscloud:event=6a8c9cdd1d50269fdeab4870&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a8644cba8a6247767434765&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.ru/5opka_mellsher_nn"),
  ("spb", False, "https://xxl.tours/#ticketscloud:event=6a8c9ec436ebea7dc86fef87&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a877a3be442a7bc9ab30638&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.com/5opka_mellsher_spb"),
  ("vrn", False, "https://xxl.tours/#ticketscloud:event=6a8ca02b0c894f75dc50c453&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a8b537fd99e706c724ce0a7&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.com/5opka_mellsher_vrn"),
  ("krd", False, "https://xxl.tours/#ticketscloud:event=6a8ca22e08aac795fa35f827&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a87826c8d2f9aa09121bff5&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.com/5opka_mellsher_krd"),
  ("kzn", False, "https://xxl.tours/#ticketscloud:event=6a8ca37a1d50269fdeab498d&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a8785f8e569721f3e5ee175&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.com/5opka_mellsher_kzn"),
  ("ufa", False, "https://xxl.tours/#ticketscloud:event=6a8ca561be323cb507c4003e&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a8786ec6762b7ca7bf8e061&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.com/5opka_mellsher_ufa"),
  ("rnd", False, "https://xxl.tours/#ticketscloud:event=6a8ca7619440dcaa79cbe5e7&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a8789c8b86338bbdf226b6a&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.com/5opka_mellsher_rnd"),
  ("ish", False, "https://xxl.tours/#ticketscloud:event=6a8ca8c74d914994b27b43c5&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a878c082e7194b377068ee3&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.ru/5opka_mellsher_ish"),
  ("ekb", False, "https://xxl.tours/#ticketscloud:event=6a8cab3d93db0e3148b29e56&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a878df09b0c7b01cdf477c7&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.com/5opka_mellsher_ekb"),
  ("smr", False, "https://xxl.tours/#ticketscloud:event=6a8cac950c894f75dc50c6d9&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjk3MjM5ODg3YTE5NTk0MWEyNTlmYjI2In0.aSxMMWSrnPzxvLGny8Jmjzxi6t4Xx6aYDxy7mHyKwok&lang=ru", "https://xxl.tours/#ticketscloud:event=6a8791add04584e78dca9b44&token=eyJhbGciOiJIUzI1NiIsImlzcyI6InRpY2tldHNjbG91ZC5ydSIsInR5cCI6IkpXVCJ9.eyJwIjoiNjg1ZDVhOGJmOWRlMzk0YzkyM2VlZTI2In0.Jqnn0UrJ6FEC4RNaktmo_qq3aPqJ7KL0qDLtDIPrWt4&lang=ru", "https://vk.com/5opka_mellsher_smr"),
]

meta = {
  "tse": ("09.10", "Астана", 10, 9),
  "ala": ("11.10", "Алматы", 10, 11),
  "vvk": ("16.10", "Владивосток", 10, 16),
  "hbr": ("17.10", "Хабаровск", 10, 17),
  "irk": ("18.10", "Иркутск", 10, 18),
  "krk": ("23.10", "Красноярск", 10, 23),
  "42": ("24.10", "Кемерово", 10, 24),
  "nsk": ("25.10", "Новосибирск", 10, 25),
  "msk": ("04.11", "Москва", 11, 4),
  "yar": ("05.11", "Ярославль", 11, 5),
  "nn": ("07.11", "Нижний Новгород", 11, 7),
  "spb": ("08.11", "Санкт-Петербург", 11, 8),
  "vrn": ("13.11", "Воронеж", 11, 13),
  "krd": ("15.11", "Краснодар", 11, 15),
  "kzn": ("21.11", "Казань", 11, 21),
  "ufa": ("22.11", "Уфа", 11, 22),
  "rnd": ("27.11", "Ростов-на-Дону", 11, 27),
  "ish": ("04.12", "Ижевск", 12, 4),
  "ekb": ("06.12", "Екатеринбург", 12, 6),
  "smr": ("07.12", "Самара", 12, 7),
}

TG = "https://t.me/tour_5opka_mellsher"
items = []
for code, combined, meet, tickets, vk in raw:
  date, city, month, day = meta[code]
  items.append({
    "date": date,
    "city": city,
    "month": month,
    "day": day,
    "tickets": tickets,
    "meet": meet,
    "combined": combined,
    "vk": vk,
    "tg": TG,
    "href": tickets or "https://xxl.tours/",
  })
items.sort(key=lambda x: (x["month"], x["day"]))


def js_obj(it):
  parts = [
    f'date: {json.dumps(it["date"], ensure_ascii=False)}',
    f'city: {json.dumps(it["city"], ensure_ascii=False)}',
    f'tickets: {json.dumps(it["tickets"], ensure_ascii=False)}',
    f'meet: {json.dumps(it["meet"], ensure_ascii=False)}',
  ]
  if it["combined"]:
    parts.append("combined: true")
  parts += [
    f'vk: {json.dumps(it["vk"], ensure_ascii=False)}',
    f'tg: {json.dumps(it["tg"], ensure_ascii=False)}',
    f'href: {json.dumps(it["href"], ensure_ascii=False)}',
  ]
  return "  { " + ", ".join(parts) + " }"


block = "const TOUR = [\n" + ",\n".join(js_obj(it) for it in items) + ",\n];"
path = Path(r"c:\Users\msmil\mellsher\js\data.js")
text = path.read_text(encoding="utf-8")
new = re.sub(r"const TOUR = \[[\s\S]*?\];", block, text, count=1)
path.write_text(new, encoding="utf-8")
print(len(items), items[0]["city"], items[-1]["city"])
