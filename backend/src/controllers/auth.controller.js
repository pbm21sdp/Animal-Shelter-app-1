export const signup = async (req, res) => {
    res.status(201).json({ message: "User created successfully" });
}

export const login = async (req, res) => {
    res.status(200).json({ message: "Logged in successfully" });
}

export const logout = async (req, res) => {
    res.status(200).json({ message: "Logged out successfully" });
}