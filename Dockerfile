FROM ubuntu:latest

MAINTAINER Kumar Shubham "kumar.shubham2015@vit.ac.in"

# Update package lists
RUN apt-get update -y

# Install node.js for running the programs
RUN apt-get install -y nodejs
# Install NPM for node packages
RUN apt-get install -y npm

# Install Python3 for running python programs
RUN apt-get install -y python3 build-essential
# Install g++ and gcc for running C/C++ prorgams;
RUN apt-get install -y gcc g++
# Install jdk and jre for running java programs
RUN apt-get install -y default-jdk default-jre


# Creating a new user for the sandbox
RUN ["adduser",  "--home",  "/usr/src/app", "--system", "sandboxuser"]
RUN ["chown", "-R", "sandboxuser", "/usr/src/app"]
RUN ["chmod", "-R", "u+rwx", "/usr/src/app"]

COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm install 

CMD [ "node","app.js"]

RUN rm /bin/ls
RUN rm /usr/bin/apt
RUN rm /bin/mv
RUN rm /bin/dd
RUN rm /bin/uname
RUN rm /sbin/mkf*
RUN rm /bin/rm
