import User from "@/entities/User";
import Availability from "@/entities/Availability";

class Service {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    estimatedDuration: number;
    availability: Availability;
    master: User;
    photos: string[];

    constructor(
        id: string,
        title: string,
        description: string,
        category: string,
        price: number,
        estimatedDuration: number,
        availability: Availability,
        master: User,
        photos: string[]
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.price = price;
        this.estimatedDuration = estimatedDuration;
        this.availability = availability;
        this.master = master;
        this.photos = photos;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            category: this.category,
            price: this.price,
            estimatedDuration: this.estimatedDuration,
            availability: {
                date: this.availability.date.toISOString(),
                isAvailable: this.availability.isAvailable
            },
            master: this.master.toJSON(),
            photos: this.photos
        };
    }

    static fromJSON(json: string): Service {
        const data = JSON.parse(json);
        const master: User = User.fromJSON(data.master);
        const availability: Availability = new Availability(
            new Date(data.availability.date),
            data.availability.isAvailable
        );
        return new Service(
            data.id,
            data.title,
            data.description,
            data.category,
            data.price,
            data.estimatedDuration,
            availability,
            master,
            data.photos
        );
    }
}

export default Service;