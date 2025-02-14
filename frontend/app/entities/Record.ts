import Service from "./Service";
import User from "./User";

class Record {
    id: string;
    record_date: Date;
    record_status: string;
    client: User;
    master: User;
    service: Service;

    constructor(id: string, record_date: Date, record_status: string, client: User, master: User, service: Service) {
        this.id = id;
        this.record_date = record_date;
        this.record_status = record_status;
        this.client = client;
        this.master = master;
        this.service = service;
    }
}

export default Record;