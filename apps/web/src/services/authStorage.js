const TOKEN_KEY = "churn_auth_token";
const USER_KEY = "churn_auth_user";

const getAuthStore = () => {
  if (localStorage.getItem(TOKEN_KEY)) {
    return localStorage;
  }
  return sessionStorage;
}

const isPersistentAuth = () => {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

const getToken = () => {
  return getAuthStore().getItem(TOKEN_KEY) || "";
}

const getUser = () => {
  const raw = getAuthStore().getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

const saveAuth = (token, user, rememberMe = true) => {
  clearAuth();

  const store = rememberMe ? localStorage : sessionStorage;
  store.setItem(TOKEN_KEY, token || "");
  store.setItem(USER_KEY, JSON.stringify(user || null));
}

const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export { TOKEN_KEY, USER_KEY, getToken, getUser, saveAuth, clearAuth, isPersistentAuth };
