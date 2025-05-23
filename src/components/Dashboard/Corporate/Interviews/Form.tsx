import { on } from 'events';
import React from 'react'
import { useForm } from 'react-hook-form';

type FormData = {
    name: string;
    email: string;
}

const Form = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues: {
            name: '',
            email: ''
        }
    })

    const onSubmit = (data: FormData) => {
        console.log("Submitted data:", data);
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
        >
            <h1 className='text-[20px] font-bold mb-[22px]'>Enter details</h1>
            <div className='mb-4'>
                <label className='text-[#0F3551] text-base font-bold mb-2'>Name</label>
                <input
                    type="text"
                    placeholder='Enter name'
                    {...register("name", { required: "Name is required" })}
                    className='rounded-lg border border-[#C5DCFD] px-4 py-3 mb-2 w-full bg-white'
                />
                {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                )}
            </div>
            <div className='mb-4'>
                <label className='text-[#0F3551] text-base font-bold mb-2'>Email</label>
                <input
                    type="email"
                    placeholder='Enter email'
                    {...register("email", { required: "Email is required" })}
                    className='rounded-lg border border-[#C5DCFD] px-4 py-3 mb-2 w-full bg-white'
                />
                {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
            </div>
            <p className="text-xs text-black">
                By proceeding, you confirm that you have read and agree to
                <a
                    href="https://example.com/terms"
                    className="text-blue-600 underline ml-1"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Worko&apos;s Terms of Use
                </a>{" "}
                and{" "}
                <a
                    href="https://example.com/privacy"
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Privacy Notice.
                </a>
            </p>
            <button
                type="submit"
                className='bg-blue-600 text-white font-bold py-2 px-4 rounded-full mt-4'
            >
                Schedule Event
            </button>
        </form>
    )
}

export default Form
