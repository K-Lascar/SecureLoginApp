# SecureLoginApp
This is a Secure Login App, with a twist!

This application was built with electron https://www.electronjs.org/

This program is meant to demonstrate the importance of security. Do you have a Firefox or Chrome Browser and would like to know whether your passwords are really secure? Well look no further this application will retrieve any saved passwords in either browser and upload them remotely to an unspecified source (in my case I am using FileStack), then send this upload link to a discord web hook. 

## Features:

It removes any instances of it being created, to create the illusion that nothing ever happened. Due to these expensive processes, it is time costly, so it's recommended to have good internet! 

Now the website I use to connect is basically an illusion, I use my website krishneelkumar.com. 

The app will also prevent the user f11, whilst in fullscreen mode, there are immediate ways of avoiding this like (alt+tab), but the aim is to have the most amount of time available for the application to retrieve the details and upload it. From what I was able to achieve was a time at worse 20 second (please be mindful of this).

This program uses external programs made with python to retrieve passwords for Chrome (python provided the most practical solution to the program).

### These are the OS's and browser that have been tested on and functional on.

|              | Firefox            | Chrome             |
| ------------ | ------------------ | ------------------ |
| Windows      | :white_check_mark: | :white_check_mark: |
| Linux        | :white_check_mark: | :white_check_mark: |
| Darwin/MacOS | :white_check_mark: | :x:                |



### Exceptions:

The reason why MacOS operating systems are difficult for Chrome, is due to the Keychain implementation, this means the user must provide the host password to unlock details.

If a user has a master password set in Firefox for the logins you will not be able to access their details (by default this is off in firefox settings).



### How to avoid this type of exploit?

These will not be full proof solutions, but extra steps one can take to avoid this type of program.

If your using Firefox set a master password, even if it's tedious doing this (as any type you open Firefox you are required to use it). Think of it as an added layer of security, for the tremendous cost that can occur.

If your using Chrome, it can be difficult to protect yourself, other than if your MacOS user you are safe for now! :eyes:  

The MIT paper below recommends using a LastPass or any secure password manager, I don't believe this is a definitive solution, but similarly to Firefox you are required to enter a master password.



Thanks to all these amazing people/resources for making this application possible!

http://filestack.com/

https://thehacktoday.com/how-to-retrieve-decrypt-stored-passwords-in-firefox-chrome-remotely/

https://gist.github.com/simonkuang

https://github.com/hakanonymos

https://github.com/priyankchheda

http://courses.csail.mit.edu/6.857/2020/projects/6-Vadari-Maccow-Lin-Baral.pdf

https://www.flaticon.com/authors/pixel-perfect
