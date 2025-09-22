import hbs from "hbs";
import path from "path";

const itemHeight = 60;

export const initHandlebars = () => {
  hbs.registerPartials(path.resolve() + "/public/partials");

  hbs.handlebars.registerHelper("offset", (index) => index * itemHeight);
  hbs.handlebars.registerHelper("getHeight", (items) => {
    if (!items) return 170;
    return items.length * itemHeight + 50;
  });
  hbs.handlebars.registerHelper("truncate", (str) => {
    if (str.length >= 45) return `${str.substr(0, 45)}...`;
    return str;
  });
  hbs.handlebars.registerHelper("isDarkMode", (theme) => theme === "dark");
};
