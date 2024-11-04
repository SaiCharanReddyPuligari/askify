"use client"
import { useAuthStore } from "@/store/Auth";
import exp from "constants";
import React from "react";

function LoginPage(){

    const {login} = useAuthStore();
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    const LoginSubmit = async (e: React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault();

        //collect data
        const formData = new FormData(e.currentTarget);
        const email = formData.get("email");
        const password = formData.get("password");

        //validate

        if(!email || !password){
            setError(()=>"fill out all the fields")
            return 
        }

        //handle loading and error
        setIsLoading(()=>true)
        setError(()=>"")

        //login ->store

        const loginResponse = await login(email.toString(), password.toString());

        if(loginResponse.error){
            setError(()=> loginResponse.error!.message)
        }
        setIsLoading(()=>false)
    }

    return (
        <div>Login Page</div>
    )

}

export default LoginPage;