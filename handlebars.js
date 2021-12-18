import hbs from "hbs";

const itemHeight = 60;

export const registerHelpers = () => {
  hbs.handlebars.registerHelper("offset", (index) => index * itemHeight);
  hbs.handlebars.registerHelper(
    "getHeight",
    (items) => items.length * itemHeight
  );
  hbs.handlebars.registerHelper("truncate", (str) => {
    if (str.length >= 45) return `${str.substr(0, 45)}...`;
    return str;
  });
};
