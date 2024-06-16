---
title: Ideas on significant improvements to the DevTools
description: Browser DevTools seem to have been standing still forever, quite useful but never good enough. Here are some ideas on how to make them better.
outline:
  - 1. Connect with modern web technologies
  - 2. Improve integration with Browser DevTools
---

## 1. Connect with modern web technologies

In web development technologies are changing. We use things like TailwindCSS, React.js and many more. But the DevTools are not keeping up with these changes. There is nothing more frustrating than trying to navigate the DevTools Styles Panel when using TailwindCSS.
For those who are unfamiliar with the problems you face: Tailwinds classes fill up the window where you usually see the properties you add to a class. In a place where you could easily change and view the properties of a specific component you now see many utility classes that take up the whole space. Changes are not quick anymore as you probably need to click on the plus button at the top to add a rule that only applies to the element (type) you selected instead to all elements that use top-0 for example.
In the case that you prefer changing the utility classes in the html elements tab there is a big chance that after a couple of changes you&apos;ll get lost trying to figure out what the changes where that you did.

## 2. Improve integration with Browser DevTools
