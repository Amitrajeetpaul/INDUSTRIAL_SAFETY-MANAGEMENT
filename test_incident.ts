


async function test() {
    try {
        // 1. Login
        console.log("Logging in...");
        const loginRes = await fetch("http://localhost:5000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "admin", password: "password123" })
        });

        if (!loginRes.ok) {
            console.error("Login failed:", await loginRes.text());
            return;
        }

        // Get cookies
        const cookie = loginRes.headers.get("set-cookie");
        console.log("Login success. Cookie:", cookie);

        // 2. Report Incident
        console.log("Reporting incident...");
        const incidentData = {
            title: "CLI Test Incident",
            description: "Testing from CLI",
            location: "CLI",
            severity: "low",
            imageUrl: ""
        };

        const reportRes = await fetch("http://localhost:5000/api/incidents", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": cookie || ""
            },
            body: JSON.stringify(incidentData)
        });

        if (!reportRes.ok) {
            console.error("Report failed status:", reportRes.status);
            console.error("Response:", await reportRes.text());
        } else {
            console.log("Report success:", await reportRes.json());
        }

    } catch (err) {
        console.error("Test failed:", err);
    }
}

test();
