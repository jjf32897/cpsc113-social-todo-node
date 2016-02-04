# Jo-Jo Feng's CPSC113 Social Todo App

This is a collaborative todo application based on Kyle's starter code.

## How to run this

Get the repo

    git clone https://github.com/kljensen/cpsc113-social-todo-node
    cd cpsc113-social-todo-node

Install the dependencies

    npm install

You'll need to start MongoDB somewhere to store data. And, you'll need to
choose a secret for signing browser cookies.

You can run the server with something similar to

    PORT=5000 SESSION_SECRET='sdf' MONGO_URL="mongodb://localhost:27017/social-todo" ./node_modules/.bin/nodemon index.js

where your values of `PORT`, `SESSION_SECRET`, and `MONGO_URL` could be different.
If you are on Cloud9, don't set `PORT`. `SESSION_SECRET` can be whatever you
want.

To see how this app was built, follow these videos. (I should have indexed the
videos by commit so that you could rewind this code. That would tough,
perhaps next time.) This code passes 31 of the tests in the test suite. It
does everything except task completion and deletion. It is roughly 250 lines
long, many of which are comments.

(There are *MANY* ways in which this app could be written. In these videos
I wanted to do it from the "[hello world code](http://expressjs.com/en/starter/hello-world.html)"
on the express.js website without using too many fancy dependencies. This is
not the fastest or the smartest way to build the app.

1. [Overview of social todo app](https://youtu.be/fZrtAwUUgyE)
1. [Running the testing code](https://youtu.be/7U5elRuEgR4)
1. [Getting started with node and express](https://youtu.be/BJPDWI4Muhg)
1. [add view layer to express](https://youtu.be/LswuoN0Ru68)
1. [add login forms to views](https://youtu.be/QiVs4iaRMco)
1. [handle submitted registration form](https://youtu.be/VKz4tKH2mME)
1. [Add mongodb support](https://youtu.be/fh5yIRR5eTU)
1. [Add form validation ](https://youtu.be/kMWyKoJ_cwc)
1. [Add session handling](https://youtu.be/vRxzjfxfCc8)
1. [Add tasks](https://youtu.be/NnEL3zHrItw)

I failed to do a few things in these screencasts. First, I did not show you
the git branch-work-commit workflow as well as I should have. Second, once
I reached the end, I
[cleaned up a few things in this commit](https://github.com/kljensen/cpsc113-social-todo-node/commit/d5ae48f998c13a83c2a52575114875b5ff6e6a1b)
and I did not record myself doing that. You'll notice that clean up involved
adding classes to certain elements and handling a few errors in a way that
the [end to end grading tests](https://git.yale.edu/cpsc-113-spring-2016/todo-e2e-tests).

You are free to use the code in any way for the first assignment, including as a
starting point for your app. This code *does not* pass tests related to task
completion and deletion. You'll need to complete those.
