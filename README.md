# ماهواره زنده — Watch Satellite TV

پخش زنده‌ی شبکه‌های ماهواره‌ای، بدون دیش، با اینترنت — به‌صورت مینی‌اپ تلگرام.

- **فید فارسی:** ۱۸۷ شبکه (لیست iptv-org + تلوبیون/پرشیانا، بدون تکرار، با اسم‌های فارسی)
- **فیدهای دیگه:** خبری، فیلم، ورزشی، موسیقی، سرگرمی
- **پخش مستقیم:** hls.js، بدون پروکسی — گوشی مستقیم به CDN وصل می‌شه
- **علاقه‌مندی و گزارش خرابی** برای هر شبکه
- **پنل ادمین:** آمار کاربرا (`/admin`) و پیام همگانی (`/broadcast`)

## معماری

- بک‌اند: Telegram Serverless (tgcloud) — بدون سرور، بدون هزینه
- دیتا: [iptv-org/iptv](https://github.com/iptv-org/iptv) + [Persiana TV](https://github.com/Samhouston010/persiana-tv-epg)
- فرانت: `web/` (فارسی، RTL) → با `npm run build` به `dist/` ساخته می‌شه

## دیپلوی

```bash
npm install
cp owner.example.js tgcloud/lib/owner.js   # آیدی عددی تلگرام خودت رو بذار
npm run build
TGCLOUD_TOKEN='<token>' npx tgcloud push
TGCLOUD_TOKEN='<token>' npx tgcloud migrate --yes
```

توکن tgcloud و توکن بات رو هیچ‌وقت کامیت نکن — فقط از طریق متغیر محیطی یا داشبورد tgcloud استفاده کن.

فایل لوگوی v3 (webp) چون باینریه توی این ریپو نیست؛ `npm run build` بدون اون هم کار می‌کنه (فقط `dist/logo.webp` ساخته نمی‌شه). برای دیپلوی کامل، فایل لوگو رو کنار کد بذار.
