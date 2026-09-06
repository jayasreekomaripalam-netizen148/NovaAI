cat > static/app.js <<'EOF'
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatMessages = document.getElementById("chatMessages");

function addMessage(message, sender) {
    const messageWrapper = document.createElement("div");

    messageWrapper.className =
        sender === "user"
            ? "message user-message"
            : "message bot-message";

    const messageContent = document.createElement("div");

    messageContent.className = "message-content";
    messageContent.textContent = message;

    messageWrapper.appendChild(messageContent);
    chatMessages.appendChild(messageWrapper);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = messageInput.value.trim();

    if (!message) {
        return;
    }

    addMessage(message, "user");

    messageInput.value = "";

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message
            })
        });

        const data = await response.json();

        if (data.success) {
            addMessage(data.response, "bot");
        } else {
            addMessage("Sorry, something went wrong.", "bot");
        }

    } catch (error) {
        console.error(error);

        addMessage(
            "Unable to connect to the server.",
            "bot"
        );
    }
});
EOF

