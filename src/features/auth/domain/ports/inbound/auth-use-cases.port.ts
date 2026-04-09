export interface LoginResult {
  accessToken: string;
}

export abstract class ILoginUseCase {
  abstract execute(dto: { email: string; password: string }): Promise<LoginResult>;
}
