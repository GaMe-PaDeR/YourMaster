export default class Availability {
    date: Date;
    timeSlots: Map<string, boolean>;

    constructor(date: Date, timeSlots?: Map<string, boolean>) {
        this.date = date;
        this.timeSlots = timeSlots || new Map();
    }

    
    public toString(): string {
        return `${this.date.toISOString().split('T')[0]} : ${this.timeSlots.size > 0 ? ' ' : ' '}`;
    }

    
    public dateToString(): string {
        return this.date.toISOString().split('.')[0];
    }
    
}
