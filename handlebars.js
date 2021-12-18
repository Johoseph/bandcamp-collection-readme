import hbs from "hbs";

const itemHeight = 60;

export const registerHelpers = () => {
  hbs.handlebars.registerHelper("offset", (index) => index * itemHeight);
  hbs.handlebars.registerHelper(
    "getHeight",
    (items) => items.length * itemHeight
  );
};
