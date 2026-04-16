export interface AuthRequest extends Request {
  user: {
    sub: string;
    nickname: string;
    email: string;
  };
}
