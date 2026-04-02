import 'dotenv/config';

async function testLogin() {
    try {
        const res = await fetch("http://localhost:5000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "admin", password: "password123" })
        });
        console.log("Status:", res.status);
        console.log("Response:", await res.text());
        console.log("Headers:", res.headers);
    } catch (err) {
        console.error(err);
    }
}

testLogin();
