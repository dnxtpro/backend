const { z } = require('zod');

const signupSchema = z.object({
  body: z.object({
    username: z.string({
      required_error: 'Username is required',
    }).min(3, 'Username must be at least 3 characters').max(20, 'Username cannot exceed 20 characters'),
    email: z.string({
      required_error: 'Email is required',
    }).email('Invalid email address'),
    password: z.string({
      required_error: 'Password is required',
    }).min(8, 'Password must be at least 8 characters'),
    roles: z.array(z.string()).optional(),
  }),
});

const signinSchema = z.object({
  body: z.object({
    username: z.string({
      required_error: 'Username is required',
    }),
    password: z.string({
      required_error: 'Password is required',
    }),
  }),
});

module.exports = {
  signupSchema,
  signinSchema,
};
