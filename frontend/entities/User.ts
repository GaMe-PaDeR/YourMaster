export class User {
    public id: string;
    public firstName: string;
    public lastName: string;
    public email: string;
    public phoneNumber: string;
    public birthday: string | null;
    public city: string | null;
    public country: string | null;
    public gender: string | null;
    public description: string | null;
    public role: string;
    public avatarUrl: string | null;
    public pushToken: string | null;
    public online: boolean;
    public accountNonExpired: boolean;
    public accountNonLocked: boolean;
    public credentialsNonExpired: boolean;
    public enabled: boolean;
    public lastOnline: string | null;

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
        avatarUrl: string | null,
        pushToken: string | null,
        online: boolean,
        accountNonExpired: boolean,
        accountNonLocked: boolean,
        credentialsNonExpired: boolean,
        enabled: boolean,
        lastOnline: string | null
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
        this.pushToken = pushToken;
        this.online = online;
        this.accountNonExpired = accountNonExpired;
        this.accountNonLocked = accountNonLocked;
        this.credentialsNonExpired = credentialsNonExpired;
        this.enabled = enabled;
        this.lastOnline = lastOnline;
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
            avatarUrl: this.avatarUrl
        };
    }

    static fromJSON(json: any): User {
        return new User(
            json.id,
            json.firstName,
            json.lastName,
            json.email,
            json.phoneNumber || "",
            json.birthday || null,
            json.city || null,
            json.country || null,
            json.gender || null,
            json.description || null,
            json.role,
            json.avatarUrl || null,
            json.pushToken || null,
            json.online || false,
            json.accountNonExpired || true,
            json.accountNonLocked || true,
            json.credentialsNonExpired || true,
            json.enabled || true,
            json.lastOnline || null
        );
    }
}

export default User;