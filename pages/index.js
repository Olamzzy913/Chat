import { useState } from "react";
import { useRouter } from "next/router";

import {
  createAuthUserWithEmailAndPassword,
  signInAuthUserWithEmailAndPassword,
  createUserDocumentFromAuth,
} from "@/utils/firebase";

const defaultFormFields = {
  name: "",
  email: "",
  password: "",
};

const signInForm = {
  email1: "",
  password1: "",
};

const Home = () => {
  const router = useRouter();

  const [formData, setFormData] = useState(defaultFormFields);
  const [signInData, setSignInData] = useState(signInForm);

  const { email1, password1 } = signInData;
  const { name, email, password } = formData;
  const resetFormFields = () => {
    setFormData(defaultFormFields);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const { user } = await createAuthUserWithEmailAndPassword(
        email,
        password
      );

      await createUserDocumentFromAuth(user, { name });
      resetFormFields();
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert("Cannot create user, email already in use");
      } else {
        console.log("user creation encountered an error", error);
      }
    }
  };

  const handleSubmit1 = async (event) => {
    event.preventDefault();

    try {
      const data = await signInAuthUserWithEmailAndPassword(email, password);
      console.log(data);
      setSignInData(signInData);
      router.push("/chat");
    } catch (error) {
      console.log("user sign in failed", error);
    }
  };

  return (
    <>
      <div className="flex md:flex-row flex-col gap-10 items-center justify-center min-h-screen bg-gray-100">
        <form
          onSubmit={handleSubmit1}
          className="bg-white p-6 rounded shadow-md w-full max-w-sm"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>

          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email1}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password1}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-500 text-white py-2 rounded shadow hover:bg-indigo-600 transition duration-300"
          >
            Sign In
          </button>
        </form>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow-md w-full max-w-sm"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700">
              name
            </label>
            <input
              type="name"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded shadow-sm focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-500 text-white py-2 rounded shadow hover:bg-indigo-600 transition duration-300"
          >
            Sign Up
          </button>
        </form>
      </div>
    </>
  );
};

export default Home;
