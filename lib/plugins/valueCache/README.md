##### Objective
To manage value cache, provide a centralise config for all cache

###### Setup
1. add `valueCache` to the `plugins` array in `app.js`
2. ensure this plugins load after the `redis` plugin
3. add a file `valueCache.js` in the `config/` directory

###### Sample Config

```
module.exports = {
  defaultExpireSec: 60 * 60 * 24,
  registrations: [
    {
      type: 'SAMPLE_TYPE', //name your cache
      expireSec: 60 * 60 * 24,
      keyPrefix: 'KEY_PREFIX', //prefix for the redis key
    },
  ],
}
```
