db = require "lapis.db"
import Model, enum from require "lapis.db.model"
import slugify from require "lapis.util"

-- Generated schema dump: (do not edit)
--
-- CREATE TABLE songs (
--   id integer NOT NULL,
--   user_id integer NOT NULL,
--   title text NOT NULL,
--   artist text,
--   album text,
--   source text,
--   song text NOT NULL,
--   players integer DEFAULT 0 NOT NULL,
--   created_at timestamp without time zone NOT NULL,
--   updated_at timestamp without time zone NOT NULL
-- );
-- ALTER TABLE ONLY songs
--   ADD CONSTRAINT songs_pkey PRIMARY KEY (id);
--
class Songs extends Model
  @timestamp: true

  @relations: {
    {"user", belongs_to: "Users"}
  }

  @create: (opts) =>
    opts.publish_status = @publish_statuses\for_db opts.publish_status or "draft"
    super opts

  @publish_statuses: enum {
    draft: 1
    public: 2
  }

  get_slug: =>
    slug = slugify @title
    if slug == ""
      return "-"

    slug

  allowed_to_edit: (user) =>
    return false unless user
    return true if user\is_admin!
    user.id == @user_id
