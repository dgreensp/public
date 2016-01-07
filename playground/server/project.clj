(defproject playground-server "0.1.0-SNAPSHOT"
  :pedantic? :abort
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [com.taoensso/carmine "2.12.1" :exclusions [com.taoensso/encore]]
                 [com.taoensso/nippy "2.11.0-beta1"]
                 [clj-aws-s3 "0.3.10" :exclusions [joda-time]]
                 [joda-time/joda-time "2.9.1"]
                 ]
  :source-paths ["src"]
  :target-path "target/%s"
  :java-source-paths ["src-java"]
  :jvm-opts ["-Djava.library.path=native-libs"
             "-Djava.security.properties=config/java-security.properties"
             "-Xmx4g" "-Xms2g" "-XX:+UseG1GC" "-XX:G1HeapRegionSize=4m"]
  :profiles {:repl {:repl-options {:init-ns playground.store
                                   :init (clojure.core/load "store")}
                    :plugins [[cider/cider-nrepl "0.9.1"]]}
             :pfp {:jvm-opts ["-XX:+PreserveFramePointer"]}
             :ssldebug {:jvm-opts ["-Djavax.net.debug=ssl"]}})
