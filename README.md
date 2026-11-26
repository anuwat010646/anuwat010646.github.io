# Portfolio — Anuwat Nakwibool

เว็บพอร์ตโฟลิโอโทนดำ (HTML + CSS + JavaScript ล้วน ไม่ต้องติดตั้งอะไร)

## โครงสร้าง

```
index.html          โครงหน้าเว็บ: Welcome → Home → About → Portfolio → Contact
css/style.css       สีและสไตล์ทั้งหมด (สีอยู่ใน :root บนสุด)
js/data.js          ★ ข้อมูลทั้งหมด: โปรเจกต์ การศึกษา tech stack ภาษา ข้อความพิมพ์เอง
js/main.js          การทำงาน: welcome, แท็บ, หน้ารายละเอียดโปรเจกต์, ตัวจำลองรีเลย์, ฟอร์ม, ลูกเล่นทุกหน้า
images/             รูปทั้งหมด (.webp)
files/              ไฟล์ CV ที่ปุ่ม "ดาวน์โหลด CV" ใช้
v1-logic-analyzer/  ดีไซน์เวอร์ชันก่อนหน้า (เก็บไว้เผื่ออยากกลับไปใช้)
```

## เปิดดู

- ดับเบิลคลิก `index.html` เปิดใน Chrome/Edge ได้เลย
- หรือใน VS Code ติดตั้งส่วนขยาย **Live Server** → คลิกขวา `index.html` → **Open with Live Server**
  (ถ้าเจอ "Forbidden. File does not reside within a trusted folder" ให้กด Ctrl+Shift+P → Manage Workspace Trust → Trust)

## แก้ไขบ่อย ๆ

- **เพิ่มโปรเจกต์:** เปิด `js/data.js` คัดลอกบล็อก `{ id: ..., title: ... }` ใน `projects` แล้วแก้ข้อความ ใส่รูปไว้ใน `images/`
- **เพิ่ม tech stack:** เพิ่มบรรทัดใน `tech` ชื่อไอคอนหาได้ที่ https://devicon.dev (ถ้าไม่มี ใส่ `abbr` เป็นตัวย่อแทน)
- **เปลี่ยนข้อความที่พิมพ์เองใน Home:** แก้ `roles`
- **เปลี่ยน CV:** วางไฟล์ใหม่ทับ `files/Resume_Anuwat_Nakwibool.pdf`

## ขึ้นเว็บจริง (ฟรี)

- **GitHub Pages:** สร้าง repo ชื่อ `anuwat010646.github.io` → push ไฟล์ทั้งหมดในโฟลเดอร์นี้ → ได้เว็บที่ `https://anuwat010646.github.io`
- **Netlify / Vercel:** ลากโฟลเดอร์นี้ไปวาง deploy ได้ทันที
