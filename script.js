const firebaseConfig = {
    apiKey: "AIzaSyAcINU2KIYxsV2WZVTTaZ3tnIXESVOSsWQ",
    authDomain: "dsplayz.firebaseapp.com",
    databaseURL: "https://dsplayz-default-rtdb.firebaseio.com/",
    projectId: "dsplayz",
    storageBucket: "dsplayz.appspot.com",
    messagingSenderId: "565599758200",
    appId: "1:565599758200:web:4f09f33c2565b5d2528a8d",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Reference to the Realtime Database
const database = firebase.database();

document.addEventListener("DOMContentLoaded", function () {
    const redeemBtn = document.getElementById('redeemBtn');
    const prizeDisplay = document.getElementById('prize');
    const cooldownToast = document.getElementById('cooldownToast');
    let toastTimeout;
    let lastRedeemTime = 0;

    // Fetch valid codes from the database and listen for changes
    const validCodesRef = database.ref('validCodes');
    validCodesRef.on('value', snapshot => {
        validCodes = snapshot.val() || {}; // Initialize as empty object if data is not available
    });

    const validCodes = {
        "RBX_WIN-ZyY983": "5",
        "RBX_WIN-TsR724": "10",
        "RBX_WIN-QpOL21": "5",
        "RBX_WIN-nMl678": "10",
        "RBX_WIN-KjI543": "25",
        "RBX_WIN-HgF210": "5",
        "RBX_WIN-eDc987": "10",
        "RBX_WIN-bAt654": "10",
        "RBX_WIN-vIr321": "20",
        "RBX_WIN-pUk678": "5"
    };

    const savedUsername = localStorage.getItem("savedUsername");
    if (savedUsername) {
        document.getElementById('passwordInput').value = savedUsername;
    }

    function showToast(text, color, duration) {
        const toast = document.getElementById("toast");
        toast.textContent = text;
        toast.style.backgroundColor = color;

        if (!toast.classList.contains("show")) {
            toast.classList.add("show");

            toastTimeout = setTimeout(() => {
                toast.classList.remove("show");
            }, duration);
        }
    }

    redeemBtn.addEventListener("click", async function () {
        const currentTime = Date.now();
        const cooldownTime = 15000;

        if (currentTime - lastRedeemTime < cooldownTime) {
            const remainingTime = Math.ceil((cooldownTime - (currentTime - lastRedeemTime)) / 1000);
            showToast(`Too fast, please slow down. Try again in ${remainingTime} seconds.`, "black", 2000);
            return;
        }

        const scInput = document.getElementById('scInput').value;
        const usernameInput = document.getElementById('passwordInput').value;

        if (!usernameInput) {
            showToast("Please enter a username", "black", 2000);
            clearPrize();
            return;
        }

        localStorage.setItem("savedUsername", usernameInput);

        if (!scInput) {
            showToast("Please enter a code", "black", 2000);
            clearPrize();
            return;
        }

        if (validCodes.hasOwnProperty(scInput)) {
            try {
                const redemptionStatus = await checkCodeRedemption(scInput);

                if (redemptionStatus) {
                    showToast("Code has already been redeemed", "red", 2000);
                    clearPrize();
                } else {
                    lastRedeemTime = currentTime;
                    await redeemCode(scInput);
                    showToast(`Code redeemed successfully! You've received ${validCodes[scInput]} Robux. Your Robux will be credited within 24 hours.`, "green", 5000);

                    // Send redemption email using SendGrid
                    const emailDetails = {
                        code: scInput,
                        robux: validCodes[scInput],
                        username: usernameInput,
                        date: new Date().toLocaleString() // You can format the date as needed
                    };
                    sendRedemptionEmail(emailDetails);
                }
            } catch (error) {
                showToast("An error occurred", "red", 2000);
                console.error(error);
            }
        } else {
            showToast("This Code is invalid", "black", 2000);
            clearPrize();
        }
    });

    async function checkCodeRedemption(code) {
        const snapshot = await database.ref('redeemedCodes').child(code).once('value');
        return snapshot.val() === true;
    }

    async function redeemCode(code) {
        await database.ref('redeemedCodes').child(code).set(true);
    }

    function clearPrize() {
        prizeDisplay.textContent = "";
    }

    async function sendRedemptionEmail(details) {
        const emailData = {
            personalizations: [
                {
                    to: [
                        {
                            email: 'darkshadowplayz1@gmail.com', // Your email address
                        }
                    ],
                    dynamic_template_data: {
                        code: details.code,
                        robux: details.robux,
                        username: details.username,
                        date: details.date
                    }
                }
            ],
            from: {
                email: 'darkshadowplayz1@gmail.com', // Sender's email address
                name: 'DsPlayz'
            },
            template_id: 'd-2caed4f358594a67ab9ed3a74527c4c8' // Replace with actual template ID
        };

        try {
            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer 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' // Replace with your SendGrid API key
                },
                body: JSON.stringify(emailData)
            });

            if (response.ok) {
                console.log('Redemption email sent successfully');
            } else {
                console.error('Error sending redemption email:', response.statusText);
            }
        } catch (error) {
            console.error('Error sending redemption email:', error);
        }
    }
});