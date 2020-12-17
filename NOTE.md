## Precept:

Initially this program was meant to be a keylogger, but I figured that'd be too simple and overdone. As a result you are able to see the finished product. Which I hope you enjoy!

This program was built as I wanted to understand whether security of login details on browsers are safe? The quick answer is for most people, not really...

The program will try to make it difficult for the user to notice that an exploit is occurring (fullscreen disabled, the program executes and downloads the file in a different directory). This is how the program performs greatly. As it's aim is to retrieve details and send it to the hacker in prompt notice, without the victim noticing.

## Lessons:

There were many difficulties in this program, it made be appreciate stacks and what javascript developers have to face on a daily basis. 

Understanding the different ways Chome stores passwords in it's Login Data sqlite file, using encryption or security mechanisms within the OS. E.g. For Windows, Chrome uses CryptProtectData (Windows API) in order to encrypt passwords. However we can simply reverse this using https://github.com/mhammond/pywin32/blob/master this module, which decrypts passwords. There is an added complexity when you are dealing with Linux and MAC operating systems though. Nevertheless, some very smart people figured out how to exploit these operating system's browsers chromium open source code: https://docs.ioin.in/writeup/bufferovernoah.com/_2016_10_17_chrome_/index.html (This anonymous person was one of the first well known exploiters of the chrome browser, before password authentication was required on MacOS) who used the code here: https://source.chromium.org/chromium/chromium/src/+/master:components/os_crypt/os_crypt_mac.mm to figure out the decryption methodology. This included the Salt, Iterations, Initialisation Vector, Hashing Function and the key chain password (requires password now).

Other users have gone beyond my project and have implemented this ability for 10 browsers on Windows, 7 browsers on MacOS, 7 browsers on Linux and much more, https://github.com/moonD4rk/HackBrowserData/

What I wanted to do with my project was the ability to retrieve details and upload it remotely as if nothing happen. There was bonus features, like logging the user's IP as well, the files would also be compressed and the link would also be posted to a personal private discord server.

Understanding the uniqueness of node js, was mixed bag of wonders, there were many interesting things I observed like how fs package including many functionalities in c posix spawn libraries, referencing sys/stat.h https://en.wikibooks.org/wiki/C_Programming/POSIX_Reference/sys/stat.h. It was very interesting to understand asynchronous and synchronous functionality worked, and how we can include async and await to add to our programs.   

Many difficulties, with implementation especially testing on different Operating Systems, seeing how they function and what breaks with the same code. 

