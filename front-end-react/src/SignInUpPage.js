import * as React from 'react';
import { useState } from 'react';
import SignIn from './SignInPage'
import SignUp from './SignUpPage'

const SignInUpPage = () => {
    const [currentForm, setCurrentForm] = useState('signin');

    const toggleForm = (formName) => {
        setCurrentForm(formName)
    }

    return (
    <div>
      {
        currentForm === "signin" ? <SignIn onFormSwitch={toggleForm} /> : <SignUp onFormSwitch={toggleForm} />
      }
    </div>
    )
}

export default SignInUpPage