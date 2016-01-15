'use strict';

/* Services */

angular.module('thisApp.services', [])
  
  // Facets declaration
  .factory('Facets', function (FacetFactory) {
    // Namespace
    let ns = {};

    ns.factory = FacetFactory;

    // Below we declare a series of facets we use in this project

    // The source of all data in there
    ns.tweets_csv = FacetFactory.newFacet('tweets.csv', {cached:true, dataFormat:'csv'});

    // The clean and rich list of tweets
    ns.tweetList = FacetFactory.newFacet('tweetList', {
      cached: true,
      dependencies:['tweets.csv'],
      // Optional, because implicit, but it is clearer to specify it
      type: 'csv',
      compute: function(){
        let tweets_csvData = FacetFactory.getFacet('tweets.csv').getData();
        let data = [...tweets_csvData].map(item => {
          let result = {};
          // Time: we use the # of millisecond, javascript style
          result.time = (new Date(item.time * 1000)).getTime();
          result.from_user_created_at = (new Date(item.from_user_created_at)).getTime();
          
          // Numbers
          result.retweet_count = parseInt(item.retweet_count, 10);
          result.favorite_count = parseInt(item.favorite_count, 10);
          result.from_user_tweetcount = parseInt(item.from_user_tweetcount, 10);
          result.from_user_followercount = parseInt(item.from_user_followercount, 10);
          result.from_user_friendcount = parseInt(item.from_user_friendcount, 10);
          result.from_user_favourites_count = parseInt(item.from_user_favourites_count, 10);
          result.from_user_listed = parseInt(item.from_user_listed, 10);

          // Extract hashtags
          // result.hashtags = item.text.match(/[#]+[A-Za-z0-9-_]+/g) || [];

          // // Extract mentions
          // result.mentions = item.text.match(/[@]+[A-Za-z0-9-_]+/g) || [];

          // // Extract words
          // let text = item.text;
          // result.hashtags.forEach(d => text = text.replace(d, d.substr(1,d.length)) );
          // result.mentions.forEach(d => text = text.replace(d, d.substr(1,d.length)) );
          // result.words = text.split(/\W+/);

          // Other transfered attributes
          [
            'id',
            'text',
            'lang',
            'location',
            'from_user_id',
            'from_user_name',
            'from_user_realname',
          ].forEach(k => {result[k] = item[k]})

          return result;
        });
        return data;
      },
      serialize: function (data) {
        return data.map(serializeTweet);
      },
      unserialize: function (data) {
        return data.map(unserializeTweet);
      },
    });

    // Tweet serialization
    function serializeTweet(item) {
      // In current state of data processing, we do nothing
      return item;
    }

    function unserializeTweet(item) {
      // Time
      item.time = parseInt(item.time, 10);
      item.from_user_created_at = parseInt(item.from_user_created_at, 10);
      
      // Numbers
      item.retweet_count = parseInt(item.retweet_count, 10);
      item.favorite_count = parseInt(item.favorite_count, 10);
      item.from_user_tweetcount = parseInt(item.from_user_tweetcount, 10);
      item.from_user_followercount = parseInt(item.from_user_followercount, 10);
      item.from_user_friendcount = parseInt(item.from_user_friendcount, 10);
      item.from_user_favourites_count = parseInt(item.from_user_favourites_count, 10);
      item.from_user_listed = parseInt(item.from_user_listed, 10);

      return item;
    }
    
    // List of #hashtags
    ns.hashtagList = FacetFactory.newFacet('hashtagList', {
      dependencies: ['tweetList'],
      compute: function () {
        const tweetList = FacetFactory.getFacet('tweetList').getData();
        return ns.extractHashtagsFromTweetList(tweetList, {all:true});
      }
    });

    // Get a list of #hashtags with a time span
    ns.getHashtagListForPeriod = function (from, to) {
      return FacetFactory.newFacet(`hashtagList-from-${from}-to-${to}`, {
        dependencies: ['tweetList'],
        ephemeral: true,
        compute: function () {
          const tweetList = FacetFactory.getFacet('tweetList').getData();
          return ns.extractHashtagsFromTweetList(tweetList, {all:false, from:from, to:to});
        }
      });
    }

    // A processing function factored for hashtag related facets
    ns.extractHashtagsFromTweetList = function (tweetList_, opts) {
      let tweetList;
      if (opts.all) {
        tweetList = tweetList_;
      } else {
        tweetList = tweetList_.filter(item => {
          return item.time >= opts.from && item.time <= opts.to;
        })
      }

      let hashtagsIndex = {};
      tweetList.forEach(item => {
        // Extract hashtags
        let hashtags = item.text.match(/[#]+[A-Za-z0-9-_]+/g) || [];
        hashtags.forEach(ht => {
          let htData = hashtagsIndex[ht] || {tweetIdList:[], temp:{dates:[], rtCounts:[], favCounts:[]}};
          htData.tweetIdList.push(item.id);
          // We get time as a number because of statistical operations (see below)
          htData.temp.dates.push(item.time);
          htData.temp.rtCounts.push(item.retweet_count);
          htData.temp.favCounts.push(item.favorite_count);
          hashtagsIndex[ht] = htData;
        });
      });

      // Compute metadata
      for (let ht in hashtagsIndex) {
        let htData = hashtagsIndex[ht];
        // Dates
        htData.temp.dates.sort();
        htData.dateFirst = htData.temp.dates[0];
        htData.dateLast = htData.temp.dates[htData.temp.dates.length-1];
        htData.dateMean = Math.round(d3.mean(htData.temp.dates));
        htData.dateMedian = Math.round(d3.median(htData.temp.dates));
        htData.dateDeviation = Math.round(d3.deviation(htData.temp.dates));
        // retweet_count
        htData.retweet_countMin = d3.min(htData.temp.rtCounts);
        htData.retweet_countMax = d3.max(htData.temp.rtCounts);
        htData.retweet_countMean = d3.mean(htData.temp.rtCounts);
        htData.retweet_countMedian = d3.median(htData.temp.rtCounts);
        htData.retweet_countDeviation = d3.deviation(htData.temp.rtCounts);
        // favorite_count
        htData.favorite_countMin = d3.min(htData.temp.favCounts);
        htData.favorite_countMax = d3.max(htData.temp.favCounts);
        htData.favorite_countMean = d3.mean(htData.temp.favCounts);
        htData.favorite_countMedian = d3.median(htData.temp.favCounts);
        htData.favorite_countDeviation = d3.deviation(htData.temp.favCounts);
        // Misc
        htData.tweetCount = htData.tweetIdList.length;
        delete htData.temp;
        hashtagsIndex[ht] = htData;
      }

      let hashtagList = [];
      for (let ht in hashtagsIndex) {
        let htData = hashtagsIndex[ht];
        htData.text = ht;
        hashtagList.push(htData);
      }

      return hashtagList;

    }

    // Get a network of #hashtags and @users with a time span
    ns.getHashtagUserNetworkForPeriod = function (from, to, tweetsLimit) {
      return FacetFactory.newFacet(`hashtagUserNetwork-from-${from}-to-${to}-tlimit-${tweetsLimit}`, {
        dependencies: ['tweetList'],
        ephemeral: true,
        compute: function () {
          const tweetList = FacetFactory.getFacet('tweetList').getData().filter(item => {
            return item.time >= from && item.time <= to;
          });

          if (tweetList.length > tweetsLimit) {
            return {overLimit: true, tweetCount:tweetList.length};
          }

          let hashtagsIndex = {};
          let usersIndex = {};
          let linksIndex = {};
          tweetList.forEach(item => {
            // User
            let user = '@' + item.from_user_name;
            let uData = usersIndex[user] || {count: 0};
            uData.count++;
            usersIndex[user] = uData;
            // Extract hashtags
            let hashtags = item.text.match(/[#]+[A-Za-z0-9-_]+/g) || [];
            hashtags.forEach(ht => {
              // Hashtag
              let htData = hashtagsIndex[ht] || {count: 0};
              htData.count++;
              hashtagsIndex[ht] = htData;
              // Link
              let link = user + ' ' + ht;
              let lData = linksIndex[link] || {count: 0};
              lData.count++;
              linksIndex[link] = lData;
            });
          });

          // TODO: Filter the network

          let nodeList = [];
          for (let ht in hashtagsIndex) {
            let htData = hashtagsIndex[ht];
            nodeList.push({
              id: ht,
              label: ht,
              type: 'hashtag',
              size: Math.sqrt(1+htData.count),
              count: htData.count,
              x: Math.random(),
              y: Math.random(),
              color: '#2E3B94',
            });
          }
          for (let user in usersIndex) {
            let uData = usersIndex[user];
            nodeList.push({
              id: user,
              label: user,
              type: 'user',
              size: Math.sqrt(1+uData.count),
              count: uData.count,
              x: Math.random(),
              y: Math.random(),
              color: '#A81A00',
            });
          }
          let edgeList = [];
          let count = 0;
          for (let l in linksIndex) {
            let lData = linksIndex[l];
            let splt = l.split(' ');
            let source = splt[0];
            let target = splt[1];
            edgeList.push({
              id: 'e' + count++,
              source: source,
              target: target,
              count: lData.count,
            });
          }

          return {network: {nodes: nodeList, edges: edgeList}};
        }
      });
    }

    // Total tweet count over time
    ns.tweetsTotalDaily = FacetFactory.newFacet('tweetsTotalDaily', {
      cached: true,
      dependencies: ['tweetList'],
      compute: function(){
        let tweetList = FacetFactory.getFacet('tweetList').getData();
        let dateIndex = {};

        tweetList.some(item => {
          let dateAsTime = getJustTheDate(item.time).getTime();
          let dateData = dateIndex[dateAsTime] || {count:0, dateString:(new Date(dateAsTime)).toDateString()};
          dateData.count++;
          dateIndex[dateAsTime] = dateData;
        });

        let list = [];
        for (let dateAsTime in dateIndex) {
          let dateData = dateIndex[dateAsTime];
          dateData.time = dateAsTime;
          list.push(dateData);
        }
        return list;

        function getJustTheDate(time) {
          return new Date((new Date(time)).toDateString());
        }
        
      },
      serialize: data => {
        return data;
      },
      unserialize: data => {
        return data.map(d => {
          // Numbers
          d.count = parseInt(d.count, 10);
          d.time = parseInt(d.time, 10);
          return d;
        });
      },
    });

    // Various simple facets
    ns.tweetCount = FacetFactory.newFacet('tweetCount', {
      dependencies: ['tweetList'],
      uncacheable: true,
      compute: function(){
        return FacetFactory.getFacet('tweetList').getData().length;
      },
    });

    return ns;
  })

  .factory('FacetFactory', function () {
    // Namespace
    let ns = {};

    // Properties
    ns.facetDictionary = {};
    // TODO: implement a config setting for cache location
    ns.cacheLocation = 'data/cache/'

    ns.getFacetList = function () {
      let result = [];

      for (let i in ns.facetDictionary) {
        result.push( ns.facetDictionary[i] );
      }

      return result;
    }

    ns.requireFacet = function (id, opts_) {
      let f = ns.getFacet(id);
      if (f) return f;
      return ns.newFacet(id, opts_);
    }

    ns.getFacet = function (id) {
      return ns.facetDictionary[id];
    }

    /**
     * Valid ways of creating a facet:
     *
     * A. With the data itself:
     *    newFacet('jedi', {data:{name:'Anakin Skywalker'}})
     *
     * B. With a cache:
     *    newFacet('jedi', {cached:true})
     *    Note: you have to ensure that the cached file is
     *          actually at the proper location
     *
     * C. With a compute method involving no dependency:
     *    newFacet('jedi', {compute:function(){return {name:'Anakin Skywalker'}}})
     *
     * D. With a compute method involving dependencies:
     *    newFacet('jediLastName', {
     *      dependencies:['jedi'],
     *      compute: function(){
     *        return getFacet('jedi').getData().name.split(' ')[1]
     *      }
     *    })
     */
    ns.newFacet = function (id, opts_) {
      const opts = opts_ || {};
      let facet = {};

      if (id) {
        if (ns.facetDictionary[id] === undefined) {
          /**
           * Facet lifecycle:
           * 1. Is it ready? YES: get the data. NO: go deeper.
           * 2. Is it cached? YES: load the data. NO: go deeper.
           * 3. Are dependencies ready? YES: compute the data.
           *    NO: Get the dependencies, then compute the data.
           *
           * NOTE: Loadability, compute method and dependencies have to be managed elsewhere.
           *       The facet object is just a helper to organize the lifecycle.
           */
          if (opts.data === undefined && !opts.cached && (opts.compute === undefined || typeof opts.compute !== 'function') ) {
            console.log(`Impossible to create facet without data OR cache OR a compute method. id:${id}`, facet);
            return;
          }
          facet.id = id;
          facet.data = undefined;
          facet.serialize = x => x;
          facet.unserialize = x => x;
          facet.formatSerialize = undefined;
          facet.formatUnserialize = undefined;
          facet.ready = false;
          facet.cached = false;
          facet.uncacheable = false;
          facet.ephemeral = false;
          facet.dependencies = [];
          facet._compute = opts.compute;
          facet.dataFormat = 'json';

          // Check and apply options
          if (opts.cached) { facet.cached = true; }
          if (opts.uncacheable) { facet.uncacheable = true; }
          if (opts.ephemeral) { facet.ephemeral = true; }

          if (opts.dependencies) {
            if (Array.isArray(opts.dependencies)) {
              facet.dependencies = opts.dependencies;
            } else {
              console.log(`Dependencies not added because they are not an array. Facet id:${id}`, facet);
            }
          }

          if (!Array.isArray(facet.dependencies)) {
            console.log(`Impossible to create facet because dependencies are not an array. id:${id}`, facet);
            return;
          }

          if (opts.data !== undefined) {
            facet.data = opts.data;
            facet.ready = true;
          }

          if (opts.dataFormat) {
            switch (opts.dataFormat) {
              case 'json':
                facet.formatUnserialize = JSON.parse;
                facet.formatSerialize = JSON.stringify;
                break;
              case 'csv':
                facet.formatUnserialize = d3.csv.parse;
                facet.formatSerialize = d3.csv.format;
                break;
              case 'csvRows':
                facet.formatUnserialize = d3.csv.parseRows;
                facet.formatSerialize = d3.csv.formatRows;
                break;
              default:
                console.log(`Unknown dataFormat ${opts.dataFormat} for facet ${id}`)
                break;
            }
          } else {
            facet.formatUnserialize = JSON.parse;
            facet.formatSerialize = JSON.stringify;
          }

          if (opts.serialize) {
            facet.serialize = opts.serialize
          }

          if (opts.unserialize) {
            facet.unserialize = opts.unserialize
          }
          
          facet.isReady = () => facet.ready;
          facet.isCached = () => !!facet.cached;
          facet.isUncacheable = () => !!facet.uncacheable;
          facet.getDependencies = () => facet.dependencies;

          facet.retrieveData = function (callback) {
            ns.clearEphemeralFacets();
            if (facet.isReady()) {
              console.log(`retrieve data: CALL ${facet.id}`);
              facet.callData(callback);
            } else if (facet.isCached()) {
              console.log(`retrieve data: LOAD ${facet.id}`);
              facet.loadData(callback, {computeAtFail: true});
            } else if (facet.areDependenciesReady()) {
              console.log(`retrieve data: COMPUTE ${facet.id}`);
              facet.computeData(callback);
            } else {
              let unreadyDependency = facet.dependencies.some(id => {
                let dependencyFacet = ns.getFacet(id);
                if (dependencyFacet && dependencyFacet.isReady && dependencyFacet.isReady()) {
                  // Dependency is OK
                  return false;
                } else {
                  // Dependency needs to be retrieved
                  console.log(`retrieve data: RETRIEVE DEPENDENCY ${dependencyFacet.id} of ${facet.id}`);
                  dependencyFacet.retrieveData(() => {
                    facet.retrieveData(callback);
                  })
                  return true;
                }
              })
            }
          }

          facet.getData = function () {
            ns.clearEphemeralFacets();
            if (facet.isReady()) {
              return facet.data;
            } else {
              console.log(`Impossible to get data because this facet is not ready: ${facet.id}`, facet);
            }
          }

          facet.clear = function () {
            console.log(`Clear data of ${facet.id}`);
            facet.ready = false;
            facet.data = undefined;
          }

          facet.clearDependencies = function () {
            ns.clearEphemeralFacets();
            console.log(`Clear data dependencies of ${facet.id}`);
            facet.dependencies.forEach(id => {
              let dependencyFacet = ns.getFacet(id);
              dependencyFacet.clear();
              dependencyFacet.clearDependencies();
            })
          }

          // Like getData but in an asynchronous fashion
          facet.callData = function (callback) {
            ns.clearEphemeralFacets();
            if (facet.isReady()) {
              callback(facet.data);
            } else {
              console.log(`Impossible to call data because this facet is not ready: ${facet.id}`, facet);
            }
          }

          facet.loadData = function (callback, opts) {
            ns.clearEphemeralFacets();
            if (facet.isCached()) {
              let url = ns.getFacetCacheURL(facet.id);
              $.get(url, function(d){
                facet.data = facet.unserialize(facet.formatUnserialize(d));
                facet.ready = true;
                callback(facet.data);
              }).fail(function() {
                  console.log(`Facet loading failed for unknown reasons.\nid:${id}\nurl:${url}\n`, facet);
                  if (opts && opts.computeAtFail) {
                    console.log('-> Now trying to compute.');
                    facet.computeData(callback, {withDependencies: true});
                  }
                })
            } else {
              console.log(`Unloadable facet: ${id}`, facet);
            }
          }

          facet.areDependenciesReady = function () {
            let ready = true
            // FIXME: stop the forEach once one false found
            facet.dependencies.forEach(id => {
              let dependencyFacet = ns.getFacet(id);
              if (dependencyFacet && dependencyFacet.isReady && dependencyFacet.isReady()) {
                // Dependency is OK
              } else {
                ready = false;
              }
            })
            return ready;
          }

          facet.computeData = function (callback, opts) {
            ns.clearEphemeralFacets();
            if (facet.areDependenciesReady()) {
              facet.data = facet._compute();
              facet.ready = true;
              callback(facet.data);
            } else if (opts && opts.withDependencies) {
              let unreadyDependency = facet.dependencies.some(id => {
                let dependencyFacet = ns.getFacet(id);
                if (dependencyFacet && dependencyFacet.isReady && dependencyFacet.isReady()) {
                  // Dependency is OK
                  return false;
                } else {
                  // Dependency needs to be retrieved
                  console.log(`retrieve data: RETRIEVE DEPENDENCY ${dependencyFacet.id} of ${facet.id}`);
                  dependencyFacet.retrieveData(() => {
                    facet.retrieveData(callback);
                  })
                  return true;
                }
              })
            } else {
              console.log(`Facet not computed because dependencies are not ready. id: ${id}`, facet);
            }
          }

          facet.download = function () {
            let data = facet.formatSerialize(facet.serialize(facet.data));
            let blob = new Blob([data], {type: "application/text;charset=utf-8"});
            saveAs(blob, ns.getFacetCacheName(facet.id));
          }

          ns.facetDictionary[facet.id] = facet;
          return facet;
        } else {
          console.log(`Facet not created because its id already exists: ${id}`, facet);
        }
      } else {
        console.log('Facet not created because it has no id', facet);
      }
    }

    ns.deleteFacet = function (id) {
      delete ns.facetDictionary[id];
    }

    ns.getFacetCacheURL = function (d) {
      let id;
      if (typeof d == 'object' && d[id]) {
        // d is the facet (though it should be the id...)
        id = d[id];
      } else {
        id = d;
      }

      if (typeof id === 'string') {
        let safeId = ns.getFacetCacheName(id);
        return `${ns.cacheLocation}${safeId}`;
      } else {
        console.log(`Cannot retrieve cache URL from id ${id}`, facet);
      }
    }

    ns.getFacetCacheName = function (id) {
      return encodeURIComponent(id);
    }

    ns.clearEphemeralFacets = function () {
      ns.getFacetList().forEach(facet => {
        if (facet.ephemeral) {
          // delete
          facet.clear();
          ns.deleteFacet(facet.id);
        }
      });
    }

    window._FacetFactory_downloadCacheables = function () {
      ns.getFacetList().forEach(facet => {
        if (facet.isReady() && !facet.isCached() && !facet.isUncacheable()) {
          // Keep facet
        } else {
          // delete
          facet.clear();
          ns.deleteFacet(facet.id);
        }
      });
      ns.getFacetList().forEach(facet => {
        console.log(`Download cacheable facet ${facet.id}`)
        facet.download()
      })
    }

    return ns;
  })