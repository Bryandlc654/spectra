import { FreelanceService } from './freelance.service';
export declare class FreelanceController {
    private service;
    constructor(service: FreelanceService);
    getProfile(req: any): Promise<{
        profile: import("../users/user.entity").User;
    }>;
}
