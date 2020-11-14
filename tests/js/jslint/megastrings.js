// Some leading comment

import something from "something.js";

fulfill(
  '"{0} (via Some Org)" <{1}>',
  [from, sender.email]
);

`"${from} (via Some Org)" <${sender.email}>`;

`hi,
it's ${name}. `;

a(`Single
newline`);

a(`Multi
mutil
newline`);

a(`<a>
   <indent>
</a>`);

tag`something`;

const emptyCountryCode = {
  script: {
    script: `
      if (_source.containsKey('countryCode')) {
        return _source.countryCode == null || _source.countryCode.length() == 0;
      } else {
        return true;
      }
    `,
  },
};
