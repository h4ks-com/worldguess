from datetime import datetime

from geoalchemy2 import Geometry, Raster, WKBElement
from sqlalchemy import JSON, BigInteger, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase): ...


class Countries(Base):
    __tablename__ = "countries"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)
    geometry: Mapped[WKBElement] = mapped_column(Geometry(geometry_type="POLYGON"))


class PopulationRaster(Base):
    __tablename__ = "population_raster"

    rid: Mapped[int] = mapped_column(primary_key=True)
    rast: Mapped[bytes] = mapped_column(Raster)


class LandAreas(Base):
    __tablename__ = "land_areas"

    id: Mapped[int] = mapped_column(primary_key=True)
    geom: Mapped[WKBElement] = mapped_column(Geometry(geometry_type="MULTIPOLYGON", srid=4326))


class DataVersion(Base):
    __tablename__ = "data_version"

    id: Mapped[int] = mapped_column(primary_key=True)
    version_hash: Mapped[str] = mapped_column(String, unique=True)


class Challenge(Base):
    __tablename__ = "challenges"

    challenge_id: Mapped[str] = mapped_column(String, primary_key=True)
    game_id: Mapped[str] = mapped_column(String, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    radius_km: Mapped[float] = mapped_column(Float, nullable=False)
    size_class: Mapped[str | None] = mapped_column(String, nullable=True)
    webhook_url: Mapped[str | None] = mapped_column(String, nullable=True)
    webhook_token: Mapped[str | None] = mapped_column(String, nullable=True)
    webhook_extra_params: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    guesses: Mapped[list["ChallengeGuess"]] = relationship(back_populates="challenge", cascade="all, delete-orphan")


class ChallengeGuess(Base):
    __tablename__ = "challenge_guesses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    challenge_id: Mapped[str] = mapped_column(
        String, ForeignKey("challenges.challenge_id", ondelete="CASCADE"), nullable=False
    )
    username: Mapped[str] = mapped_column(String, nullable=False)
    guess: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    challenge: Mapped["Challenge"] = relationship(back_populates="guesses")
