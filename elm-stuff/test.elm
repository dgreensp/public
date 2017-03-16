module Main exposing (..)

import Html exposing (Html, div, text)
import Html.Events exposing (onClick)
import Slush exposing (Slush(Rec, Vec), (:=))

main =
    Html.beginnerProgram
        { model = init
        , view = view
        , update = update
        }




-- MODEL

type alias Model = Slush

init : Model
init =
    Rec "or" ["terms" := Vec [Slush.Int 1, Slush.Int 2]]


-- UPDATE


type alias Msg
    = Never


update : Msg -> Model -> Model
update msg model =
    never msg

-- VIEW

recView : Slush.Tag -> Slush.Fields -> Html Msg
recView tag fields =
    div []
        [div [] [text tag]]

view : Model -> Html Msg
view model =
    case model of
        Rec tag fields -> recView tag fields
        _ -> text ""

