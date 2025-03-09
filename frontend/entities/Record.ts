import Service from "./Service";
import User from "./User";

export interface Record {
    id: string;
    recordDate: string;
    recordStatus: string;
    client: User;
    master: User;
    service: Service;
}

export enum UserRole {
  CLIENT = "ROLE_CLIENT",
  MASTER = "ROLE_MASTER",
}

export default Record;