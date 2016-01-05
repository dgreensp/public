(ns playground.redis
  (:require [taoensso.carmine :as redis]))

(load-file "/Users/dgreenspan/Dropbox/Projects/playground-private.clj")

(def GOO {:pool {} :spec REDIS-DB})

(defmacro goo [& body] `(redis/wcar GOO ~@body))

(goo (redis/keys "*"))

(goo (redis/set "foo" "bar"))
(goo (redis/del "foo"))
(goo (redis/strlen "foo"))
(goo (redis/get "foo"))

(goo (redis/set "f00" (byte-array [1 2 3])))
(goo (redis/strlen "f00"))
(vec (goo (redis/parse-raw (redis/get "f00"))))

(goo (redis/set "f00d" (redis/raw (byte-array [1 2 3]))))
(goo (redis/strlen "f00d"))
(vec (goo (redis/parse-raw (redis/get "f00d"))))

(goo (redis/set "obj" {:hello "world"}))
(goo (redis/get "obj"))
(vec (goo (redis/parse-raw (redis/get "obj"))))
