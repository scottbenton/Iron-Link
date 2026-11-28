import { ColorScheme } from "repositories/shared.types";
import { UserDTO, UserRepository } from "repositories/user.repository";

export interface IUser {
  id: string;
  displayName: string | null;
  /** The Everywhere theme. Null is Default. */
  colorScheme: ColorScheme | null;
}

export class UserService {
  public static async getUser(userId: string): Promise<IUser> {
    const userDTO = await UserRepository.getUser(userId);
    return this.convertUserDTOToUser(userDTO);
  }

  public static setUserName(
    userId: string,
    displayName: string,
  ): Promise<string | null> {
    return UserRepository.updateUser(userId, { display_name: displayName });
  }

  public static async setColorScheme(
    userId: string,
    colorScheme: ColorScheme | null,
  ): Promise<void> {
    await UserRepository.updateUser(userId, { color_scheme: colorScheme });
  }

  private static convertUserDTOToUser(userDTO: UserDTO): IUser {
    return {
      id: userDTO.id,
      displayName: userDTO.display_name,
      colorScheme: Object.values(ColorScheme).includes(
        userDTO.color_scheme as ColorScheme,
      )
        ? (userDTO.color_scheme as ColorScheme)
        : null,
    };
  }
}
