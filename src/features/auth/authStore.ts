import { PassThrough } from "stream";
import { create } from "zustand";

type FirstNameStore = {
    firstName: string;
    setFirstName: (fname: string) => void;
    reset: () => void;
}

type LastNameStore = {
    lastName: string;
    setLastName: (lname: string) => void;
    reset: () => void;
}

type EmailStore = {
    email: string;
    setEmail: (email: string) => void;
    reset: () => void;
}

type PasswordStore = {
    password: string;
    setPassword: (password: string) => void;
    reset: () => void;
}

// custom hook that can be used in a component

export const useFirstNameStore = create<FirstNameStore>((set, _, store) => ({ // set, get, store they are position-dependent. set and get are helper method, while store is the instance or object itself
    firstName: "",
    setFirstName: (fname:string) => set({firstName: fname}),
    reset: () => set(store.getInitialState())
}));

export const useLastNameStore = create<LastNameStore>((set, _, store) => ({
    lastName: "",
    setLastName: (lname: string) => set({lastName: lname}),
    reset: () => set(store.getInitialState())
}));

export const useEmailStore = create<EmailStore>((set, _, store) => ({
    email: "",
    setEmail: (email: string) => set({email: email}),
    reset: () => set(store.getInitialState())

}));

export const usePasswordStore = create<PasswordStore>((set, _, store) => ({
    password: "",
    setPassword: (password: string) => set({password: password}),
    reset: () => set(store.getInitialState())

}));