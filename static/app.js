const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatMessages = document.getElementById("chatMessages");
const sendButton = document.getElementById("sendButton");
const clearChat = document.getElementById("clearChat");
const themeToggle = document.getElementById("themeToggle");
const newChat = document.getElementById("newChat");
const historyToggle = document.getElementById("historyToggle");
const closeHistory = document.getElementById("closeHistory");
const historyPanel = document.getElementById("historyPanel");
const conversationList = document.getElementById("conversationList");
const historyNewChat = document.getElementById("historyNewChat");

const STORAGE_KEY = "novaai_conversations";
const ACTIVE_KEY = "novaai_active_conversation";
const THEME_KEY = "novaai_theme";

let conversations = {};

try {
    conversations = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
    );
} catch (error) {
    console.error("Could not load conversations:", error);
    conversations = {};
}

let activeConversationId =
    localStorage.getItem(ACTIVE_KEY);

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

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

    if (activeConversationId) {
        localStorage.setItem(
            ACTIVE_KEY,
            activeConversationId
        );
    }

    renderConversationList();
}

function renderConversationList() {
    if (!conversationList) {
        return;
    }

    conversationList.innerHTML = "";

    const ids = Object.keys(conversations).reverse();

    if (ids.length === 0) {
        conversationList.innerHTML = `
            <div class="history-empty">
                No conversations yet.
            </div>
        `;
        return;
    }

    ids.forEach(id => {
        const conversation = conversations[id];

        const item = document.createElement("div");

        item.className =
            "conversation-item" +
            (id === activeConversationId ? " active" : "");

        item.innerHTML = `
            <span>💬</span>
            <span class="conversation-title">
                ${escapeHtml(
                    conversation.title || "New conversation"
                )}
            </span>
            <button
                class="history-delete"
                type="button"
                title="Delete conversation"
            >
                🗑️
            </button>
        `;

        item.addEventListener("click", event => {
            if (
                event.target.closest(".history-delete")
            ) {
                return;
            }

            activeConversationId = id;

            saveConversations();
            renderConversation();
            renderConversationList();

            if (historyPanel) {
                historyPanel.classList.remove("open");
            }
        });

        const deleteButton =
            item.querySelector(".history-delete");

        deleteButton.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                delete conversations[id];

                if (id === activeConversationId) {
                    const remaining =
                        Object.keys(conversations);

                    if (remaining.length > 0) {
                        activeConversationId =
                            remaining[remaining.length - 1];
                    } else {
                        activeConversationId = null;
                        createConversation();
                    }
                }

                saveConversations();
                renderConversation();
                renderConversationList();
            }
        );

        conversationList.appendChild(item);
    });
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
    if (!chatMessages) {
        return;
    }

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

    message.className =
        `message ${type}-message`;

    if (type === "bot") {
        const avatar = document.createElement("div");

        avatar.className = "avatar";
        avatar.textContent = "🤖";

        message.appendChild(avatar);
    }

    const wrapper = document.createElement("div");

    const content =
        document.createElement("div");

    content.className = "message-content";
    content.textContent = text;

    const timestamp =
        document.createElement("div");

    timestamp.className = "message-time";
    timestamp.textContent = time;

    wrapper.appendChild(content);
    wrapper.appendChild(timestamp);

    message.appendChild(wrapper);

    chatMessages.appendChild(message);
}

function renderConversation() {
    const conversation =
        getActiveConversation();

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

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}

function saveMessage(text, type, role) {
    const conversation =
        getActiveConversation();

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
    const conversation =
        getActiveConversation();

    if (!conversation) {
        return [];
    }

    return conversation.messages
        .filter(message =>
            message.role === "user" ||
            message.role === "assistant"
        )
        .slice(-20)
        .map(message => ({
            role: message.role,
            content: message.text
        }));
}

function addMessage(text, type, role) {
    renderMessage(
        text,
        type,
        getTime()
    );

    saveMessage(
        text,
        type,
        role
    );

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}

function addTypingIndicator() {
    const message =
        document.createElement("div");

    message.className =
        "message bot-message";

    message.id =
        "typingIndicator";

    const avatar =
        document.createElement("div");

    avatar.className = "avatar";
    avatar.textContent = "🤖";

    const content =
        document.createElement("div");

    content.className =
        "message-content typing";

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
        document.getElementById(
            "typingIndicator"
        );

    if (typing) {
        typing.remove();
    }
}

chatForm.addEventListener(
    "submit",
    async event => {

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

        messageInput.value = "";

        messageInput.disabled = true;
        sendButton.disabled = true;

        addTypingIndicator();

        try {

            console.log(
                "Sending message to NovaAI:",
                message
            );

            const response =
                await fetch(
                    "/api/chat",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            message: message,
                            history:
                                getApiHistory()
                        })
                    }
                );

            console.log(
                "API HTTP status:",
                response.status
            );

            const data =
                await response.json();

            console.log(
                "NovaAI response:",
                data
            );

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
                    "NovaAI could not respond.",
                    "bot",
                    "assistant"
                );
            }

        } catch (error) {

            console.error(
                "NovaAI request failed:",
                error
            );

            removeTypingIndicator();

            addMessage(
                "Unable to connect to the server. Please try again.",
                "bot",
                "assistant"
            );

        } finally {

            messageInput.disabled = false;
            sendButton.disabled = false;

            messageInput.focus();
        }
    }
);

newChat.addEventListener(
    "click",
    () => {

        createConversation();

        renderConversation();

        messageInput.focus();
    }
);

clearChat.addEventListener(
    "click",
    () => {

        if (!activeConversationId) {
            createConversation();
        }

        conversations[
            activeConversationId
        ] = {
            title: "New conversation",
            messages: []
        };

        saveConversations();

        renderWelcome();

        messageInput.focus();
    }
);

themeToggle.addEventListener(
    "click",
    () => {

        const dark =
            document.body.classList.toggle(
                "dark-mode"
            );

        localStorage.setItem(
            THEME_KEY,
            dark ? "dark" : "light"
        );

        themeToggle.textContent =
            dark ? "☀️" : "🌙";
    }
);

function loadTheme() {

    const theme =
        localStorage.getItem(
            THEME_KEY
        );

    if (theme === "dark") {

        document.body.classList.add(
            "dark-mode"
        );

        themeToggle.textContent =
            "☀️";

    } else {

        themeToggle.textContent =
            "🌙";
    }
}

function initialize() {

    if (
        !activeConversationId ||
        !conversations[activeConversationId]
    ) {
        createConversation();
    }

    renderConversation();

    loadTheme();

    messageInput.focus();
}

historyToggle.addEventListener(
    "click",
    () => {

        historyPanel.classList.toggle(
            "open"
        );

        renderConversationList();
    }
);

closeHistory.addEventListener(
    "click",
    () => {

        historyPanel.classList.remove(
            "open"
        );
    }
);

historyNewChat.addEventListener(
    "click",
    () => {

        createConversation();

        renderConversation();

        renderConversationList();

        historyPanel.classList.remove(
            "open"
        );

        messageInput.focus();
    }
);

initialize();
