module Slush exposing (Slush(..), Tag, Fields, (:=))

type alias Tag = String
type alias Fields = List (String, Slush)
type Slush
    = Rec Tag Fields
    | Vec (List Slush)
    | Int Int
    | String String

(:=) : a -> b -> (a, b)
(:=) a b = (a, b)
