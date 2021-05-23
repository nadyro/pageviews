import express = require("express");
import {UsersController} from "../../../controllers/users.controller";

export const saveUser = async (req: express.Request, res: express.Response) => {
    try {
        const usersController = new UsersController(req, res);
        return usersController.saveUser();
    } catch (e) {
        console.error(e);
    }
}

export const deleteUser = async(req: express.Request, res: express.Response) => {
    try {
        const usersController = new UsersController(req, res);
        return usersController.deleteUser();
    } catch(e) {
        console.error(e);
    }
}

export const updateUser = async(req: express.Request, res: express.Response) => {
    try {
        const usersController = new UsersController(req, res);
        return usersController.updateUser();
    } catch (e) {
        console.error(e);
    }
}

export const getUser = async(req: express.Request, res: express.Response) => {
    try {
        const usersController = new UsersController(req, res);
        return usersController.getUser().then(() => {
        })
    } catch (e) {
        console.error(e);
    }
}

export const getUsers = async(req: express.Request, res: express.Response) => {
    try {
        const usersController = new UsersController(req, res);
        return usersController.getUsers();
    } catch (e) {
        console.error(e);
    }
}

export const login = async(req: express.Request, res: express.Response) => {
    try {
        const usersController = new UsersController(req, res);
        return usersController.login();
    } catch (e) {
        console.error(e);
    }
}

export const logout = async(req: express.Request, res: express.Response) => {
    try {
        const usersController = new UsersController(req, res);
        return usersController.logout();
    } catch (e) {
        console.error(e);
    }
}
