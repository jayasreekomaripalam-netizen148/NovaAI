const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatMessages = document.getElementById("chatMessages");
const sendButton = document.getElementById("sendButton");
const clearChat = document.getElementById("clearChat");
const themeToggle = document.getElementById("themeToggle");
const newChat = document.getElementById("newChat");

const STORAGE_KEY = "novaai_conversations";
const ACTIVE_KEY = "novaai_active_conversation";
const THEME_KEY = "novaai_theme";

let conversations = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "{}"
);

let activeConversationId =
    localStorage.getItem(ACTIVE_KEY);

function createConversation() {
    const id = Date.now().toString();

    conversations[id] = {
        title: "New conversation",
        messages: []
    };

    activeConversationId = id;

    saveConversations();

    return id;
}

function saveConversations() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(conversations)
    );

    localStorage.setItem(
        ACTIVE_KEY,
        activeConversationId
    );
}

function getActiveConversation() {
    return conversations[activeConversationId];
}

function getTime() {
    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function renderWelcome() {
    chatMessages.innerHTML = `
        <div class="welcome-card">
            <div class="welcome-icon">✨</div>
            <h2>Welcome to NovaAI</h2>
            <p>
                Your intelligent AI assistant.
                Ask a question and start a conversation.
            </p>
        </div>
    `;
}

function renderMessage(text, type, time) {

    const message = document.createElement("div");
    message.className = `message ${type}-message`;

    if (type === "bot") {

        const avatar = document.createElement("div");
        avatar.className = "avatar";
        avatar.textContent = "🤖";

        message.appendChild(avatar);
    }

    const wrapper = document.createElement("div");

    const content = document.createElement("div");
    content.className = "message-content";
    content.textContent = text;

    const timestamp = document.createElement("div");
    timestamp.className = "message-time";
    timestamp.textContent = time;

    wrapper.appendChild(content);
    wrapper.appendChild(timestamp);

    message.appendChild(wrapper);

    chatMessages.appendChild(message);
}

function renderConversation() {

    const conversation = getActiveConversation();

    renderWelcome();

    if (!conversation) {
        return;
    }

    conversation.messages.forEach(message => {
        renderMessage(
            message.text,
            message.type,
            message.time
        );
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function saveMessage(text, type, role) {

    const conversation = getActiveConversation();

    if (!conversation) {
        return;
    }

    conversation.messages.push({
        text: text,
        type: type,
        role: role,
        time: getTime()
    });

    if (
        conversation.title === "New conversation" &&
        role === "user"
    ) {
        conversation.title =
            text.length > 30
                ? text.substring(0, 30) + "..."
                : text;
    }

    saveConversations();
}

function getApiHistory() {

    const conversation = getActiveConversation();

    if (!conversation) {
        return [];
    }

    return conversation.messages
        .filter(message =>
            message.role === "user" ||
            message.role === "assistant"
        )
        .slice(-21)
        .map(message => ({
            role: message.role,
            content: message.text
        }));
}

function addMessage(text, type, role) {

    const time = getTime();

    renderMessage(text, type, time);

    saveMessage(text, type, role);

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}

function addTypingIndicator() {

    const message = document.createElement("div");

    message.className = "message bot-message";
    message.id = "typingIndicator";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "🤖";

    const content = document.createElement("div");
    content.className = "message-content typing";

    content.innerHTML =
        "<span></span><span></span><span></span>";

    message.appendChild(avatar);
    message.appendChild(content);

    chatMessages.appendChild(message);

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}

function removeTypingIndicator() {

    const typing =
        document.getElementById("typingIndicator");

    if (typing) {
        typing.remove();
    }
}

chatForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const message =
        messageInput.value.trim();

    if (!message) {
        return;
    }

    if (!activeConversationId) {
        createConversation();
    }

    addMessage(
        message,
        "user",
        "user"
    );
history: getApiHistory()
    messageInput.value = "";

    messageInput.disabled = true;
    sendButton.disabled = true;

    addTypingIndicator();

    try {

        const response = await fetch(
            "/api/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message,
                    history: getApiHistory()
                })
            }
        );

        const data = await response.json();

        removeTypingIndicator();

        if (data.success) {

            addMessage(
                data.response,
                "bot",
                "assistant"
            );

        } else {

            addMessage(
                data.error ||
                "Something went wrong.",
                "bot",
                "assistant"
            );
        }

    } catch (error) {

        removeTypingIndicator();

        addMessage(
            "Unable to connect to the server. Please try again.",
            "bot",
            "assistant"
        );

        console.error(error);
    }

    messageInput.disabled = false;
    sendButton.disabled = false;

    messageInput.focus();
});

newChat.addEventListener("click", () => {

    createConversation();

    renderConversation();

    messageInput.focus();
});

clearChat.addEventListener("click", () => {

    if (!activeConversationId) {
        createConversation();
    }

    conversations[activeConversationId] = {
        title: "New conversation",
        messages: []
    };

    saveConversations();

    renderWelcome();

    messageInput.focus();
});

themeToggle.addEventListener("click", () => {

    const dark =
        document.body.classList.toggle("dark-mode");

    localStorage.setItem(
        THEME_KEY,
        dark ? "dark" : "light"
    );

    themeToggle.textContent =
        dark ? "☀️" : "🌙";
});

function loadTheme() {

    const theme =
        localStorage.getItem(THEME_KEY);

    if (theme === "dark") {

        document.body.classList.add("dark-mode");

        themeToggle.textContent = "☀️";

    } else {

        themeToggle.textContent = "🌙";
    }
}

function initialize() {

    if (!activeConversationId ||
        !conversations[activeConversationId]) {

        createConversation();
    }

    renderConversation();

    loadTheme();

    messageInput.focus();
}

initialize();
