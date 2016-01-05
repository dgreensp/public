(defproject playground-server "0.1.0-SNAPSHOT"
  :pedantic? :abort
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [com.taoensso/carmine "2.12.1"]]
  :source-paths ["src"]
  :target-path "target/%s"
  :java-source-paths ["src-java"]
  :jvm-opts ["-Djava.library.path=native-libs"
             "-Djava.security.properties=config/java-security.properties"
             "-Xmx4g" "-Xms2g" "-XX:+UseG1GC" "-XX:G1HeapRegionSize=4m"]
  :profiles {:repl {:repl-options {:init-ns playground.redis
                                   :init (clojure.core/load "redis")}
                    :plugins [[cider/cider-nrepl "0.9.1"]]}
             :pfp {:jvm-opts ["-XX:+PreserveFramePointer"]}
             :ssldebug {:jvm-opts ["-Djavax.net.debug=ssl"]}})
