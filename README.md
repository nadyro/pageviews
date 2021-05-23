# Page Views by Nadir Sehnoun for Datadog

# Table of content
<a href="#features">Features</a>

<a href="#requirements">Requirements</a>

<a href="#getting-started">Getting started</a>

<a href="#Usage">Usage</a>

<a href="#navigation">Navigation</a>

<a href="#improval">Improval</a>

<a href="#the-algorithm">The Algorithm</a>

<a href="#blacklist-filter">Blacklist filter</a>

<a href="#data-structure">Data structure</a>

<a href="#socketio">Socket.io</a>

<a href="#date-range">Date Range</a>

<a href="#blacklist-filter">Blacklist filter</a>

<a href="#data-structure">Data structure</a>

# Features
Download and Ungzip of queried file through the web interface

Write of results in local files

Web Interface

Login / Logout

Profile Section with queried page views

# Requirements

Mongod server running

Redis server running

# Getting started
<h3> Step 1 : Dependencies </h3>
Clone the project locally

<pre> npm install </pre>

<h4>If you're on a unix based system (Linux MacOS)</h4>
<pre> npm install </pre>
<pre> npm run config-real-os</pre>
<pre> npm run fire</pre>
<h4>If you're on windows</h4>
Make sure that you have a MongoDb Database Server running

Install Redis from here => https://redis.io/download and launch it

<h3> Step 2 : Web </h3>

Once you're all set, navigate to http://localhost:3001/

# Usage

Navigate through the web site by creating an account.

The passwords are hashed once it arrives on the server side and stored in a local database.

You are free to use whatever password you want, there is no filter

Once you're logged in, you'll see several navigation button on the header.

# Navigation
<pre>'Product' is a quick description of how I worked and what I felt and also what need improval</pre> 

<pre>'Pageviews' is the interface where you input the parameters of the data you want to analyze.</pre> 

Set a beginning and ending date.

You cannot set an ending date that happens before the starting date. Same for the hours.

Since it is a WIP, I still need to figure out how to display the data in this page as it gets computed.

<pre>Profile is the user interface where you'll find the requested pageviews.</pre>

Clicking on them triggers an NgSelect module with all the sub-domains sorted.

The NgSelect module allows you to search and select any sub-domain contained in the pageview previously computed.

Select a sub-domain triggers a table component displaying major informations on the page view.

You can delete any selected sub-domain from the table.

<pre>During the computing, if a pageview failed to be computed or to be downloaded, you'll also find it in the profile section with a 
tooltip allowing you to re-compute it.</pre>

# Improval

A lot of things here need to be improved. Actually, everything.

As I have explained in the code comments, I had several choices to do based on the situation.

I really wanted to focus on the Fullstack aspect of the project rather than front or back end. More than anything, and even if it is a technical test,
I wanted to enjoy working on it and doing it my way.

Obviously the time constraints made me make quick and dirty choices which made the ensemble pretty fragile, but I am convinced that
with time, it shall become a very powerful tool.

# The Algorithm

As you'll notice quickly, the algorithm I implemented is pretty basic. It is more a brute force based algorithm than anything else.
I came up with the idea of splitting the original pageview file to be downloaded into several sub-domain files.

This method appeared to me with several advantages, one of the main ones being the blacklist filtering.

# Blacklist filter

Indeed, as the original file will be splitted in sub-domain files, so will the blacklist file. Therefore, each time I'll compute a sub-domain file to retrieve
the top 25 viewed pages, in order to filter the blacklisted pages out from it, I'll just have to read the same sub-domain blacklist file that corresponds.

# Data structure

I chose to make this project with Node.js and Angular.
I am pretty familiar with both and I love Typescript. It has revealed itself as being quite helpful in this project.

As you'll notice in the code, the main algorithmic part will be dealing with javascript object types. Not arrays, not strings but objects.

The advantage of this choice is the targetting.

Obviously, the most consuming task for a filtering project is browsing. Browsing through arrays, browsing through files, etc...

I was already doing enough browsing with all the file reading and file copying, so I thought about something easier.

I stored the listed pages inside an object, a container, and indexed it with the name of the page rather than a number.

This provided me with one major advantage for the blacklist and most viewed pages filter :

Instead of browsing through a whole array of pages, I'd just get a page with it's name, this is a space complexity of O(1) instead of O(n).

Obviously, in order to build that kind of object, I had to pass through a O(n) complexity. But this is already making me win time and processing power.

If I had more time, I'd think about a way to read the data incoming by chunks, instead of whole files. Then, I'd sort and merge each chunks as they come.

Obviously, Node.js has its strengths and asynchronicity greatly helped through this exercise, but I feel like there would have been far better technologies for this
kind of task.

# Socket.io

I chose to implement socket.io in order to communicate with the client each time a sub-domain is computed.

This has the advantage of keeping the user updated with the process rather than making him wait until the whole computing is done.


# Date Range

For now, it just loops between the start and end date and computes each file within the range.

It was pretty hard to implement that feature along with HTTP requests since the headers are sent back to the client after the first date processed.

I had to use socket.io once again to update the client with the dates remaining.

