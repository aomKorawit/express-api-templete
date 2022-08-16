# อัพเดตล่าสุด

16 สิงหาคม 2565
- ปรับปรุง api `login`
    - เพิ่มระบบใส่พาสเวิร์ดผิดเกิน 3 ครั้งจะทำการล็อคบัญชีผู้ใช้งานเป็นเวลา 15 นาที

29 ตุลาคม 2564
- ปรับปรุงระบบส่งเมล์
- เพิ่ม responsive order mail templete

# คำแนะนำ

- ข้อมูล API ที่เป็นตัวอย่างจะชื่อไฟล์ F&N-Ecommerce.postman_collection สามารถนำไปใช้งานได้เลยโดยนำไป import ในโปรแกรม Postman

- ให้ Copy `.env.example` มาอีกอัน แล้วเปลี่ยนชื่อเป็น `.env` เพื่อให้ project สามารถใช้ environment variables ได้

- สั่ง `npm run dev` ให้ Service ทำงานใน Development Mode

- การเรียกใช้ระบบส่งอีเมล์ ยกตัวอย่างส่งอีเมล์สมัครสมาชิกสำเร็จ
    const Email = require('../utils/email');
    await new Email(newUser, url).sendWelcome();

    หรือดูตัวอย่างได้จากไฟล์ authController


# Services

- API จะเข้าผ่าน `http://localhost:3000/api`
- API ที่มีการแสดงค่าในรูปแบบ pagination ด้วย จะสามารถกำหนดค่าต่างๆในส่วน parameter ต่อท้าย api ได้ดังนี้
    - limit=20 เป็นการกำหนดค่าจำนวนที่แสดงข้อมูลต่อ 1 หน้า
    โดยค่า 20 ในตัวอย่างสามารถแทนด้วยเลขที่ต้องการตั้งค่าได้
    - page=2 เป็นการเปลี่ยนหมายเลขหน้าที่จะแสดงข้อมูล
    โดยค่า 2 ในตัวอย่างสามารถแทนด้วยเลขที่ต้องการตั้งค่าได้
- ตัวอย่างการใช้งานการต่อท้าย api ด้วย parameter
`http://localhost:3000/api/brand?limit=1&page=2`
