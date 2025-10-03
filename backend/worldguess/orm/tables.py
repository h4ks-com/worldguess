from geoalchemy2 import Geometry, Raster, WKBElement
from sqlalchemy import String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


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


class DataVersion(Base):
    __tablename__ = "data_version"

    id: Mapped[int] = mapped_column(primary_key=True)
    version_hash: Mapped[str] = mapped_column(String, unique=True)
