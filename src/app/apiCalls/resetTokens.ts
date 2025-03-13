import { AuthController } from "../../shared/controllers/AuthController.js"

export const resetTokens = async () => {
    await AuthController.setAllUsersNewTokens()
}