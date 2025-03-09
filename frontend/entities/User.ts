class User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    birthday: string | null;
    city: string | null;
    country: string | null;
    gender: string | null;
    description: string | null;
    role: string;
    avatarUrl: string | null;

    constructor(
        id: string,
        firstName: string,
        lastName: string,
        email: string,
        phoneNumber: string,
        birthday: string | null,
        city: string | null,
        country: string | null,
        gender: string | null,
        description: string | null,
        role: string,
        avatarUrl: string | null
    ) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.birthday = birthday;
        this.city = city;
        this.country = country;
        this.gender = gender;
        this.description = description;
        this.role = role;
        this.avatarUrl = avatarUrl;
    }

    
    toJSON() {
        return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            phoneNumber: this.phoneNumber,
            birthday: this.birthday,
            city: this.city,
            country: this.country,
            gender: this.gender,
            description: this.description,
            role: this.role,
            avatarUrl: this.avatarUrl
        };
    }

    
    static fromJSON(json: any): User {
        return new User(
            json.id,
            json.firstName,
            json.lastName,
            json.email,
            json.phoneNumber,
            json.birthday,
            json.city,
            json.country,
            json.gender,
            json.description,
            json.role,
            json.avatarUrl
        );
    }
}

export default User;